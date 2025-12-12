import supabase from "./_supabase.js";

// Consolidated auth API - handles login, logout, verify, OTP, setup

export default async function handler(req, res) {
  const { action } = req.query;

  // POST /api/auth?action=login
  if (action === "login" && req.method === "POST") {
    return handleLogin(req, res);
  }

  // POST /api/auth?action=logout
  if (action === "logout" && req.method === "POST") {
    return handleLogout(req, res);
  }

  // GET /api/auth?action=verify
  if (action === "verify" && req.method === "GET") {
    return handleVerify(req, res);
  }

  // POST /api/auth?action=magic-link
  if (action === "magic-link" && req.method === "POST") {
    return handleMagicLink(req, res);
  }

  // POST /api/auth?action=verify-otp
  if (action === "verify-otp" && req.method === "POST") {
    return handleVerifyOtp(req, res);
  }

  // POST /api/auth?action=setup
  if (action === "setup" && req.method === "POST") {
    return handleSetup(req, res);
  }

  return res.status(400).json({ message: "Invalid action" });
}

// Login with email/password
async function handleLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e password sono richiesti" });
  }

  try {
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const crypto = await import("crypto");
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + user.salt)
      .digest("hex");

    if (hashedPassword !== user.password_hash) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await supabase.from("admin_sessions").insert({
      user_id: user.id,
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    return res.status(200).json({
      token: sessionToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Errore durante il login" });
  }
}

// Logout
async function handleLogout(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    await supabase.from("admin_sessions").delete().eq("token", token);
  }
  return res.status(200).json({ message: "Logout effettuato" });
}

// Verify session
async function handleVerify(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token mancante" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const { data: session, error } = await supabase
      .from("admin_sessions")
      .select("*, admin_users(*)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({ message: "Sessione non valida o scaduta" });
    }

    return res.status(200).json({
      user: {
        id: session.admin_users.id,
        email: session.admin_users.email,
        name: session.admin_users.name,
        role: session.admin_users.role,
      },
    });
  } catch (err) {
    console.error("Verify error:", err);
    return res.status(500).json({ message: "Errore durante la verifica" });
  }
}

// Send OTP magic link
async function handleMagicLink(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email richiesta" });
  }

  try {
    const { data: user } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (!user) {
      return res.status(200).json({ message: "Se l'email è registrata, riceverai un codice" });
    }

    const crypto = await import("crypto");
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await supabase.from("admin_otp").insert({
      user_id: user.id,
      code: otpCode,
      token: otpToken,
      expires_at: expiresAt.toISOString(),
    });

    console.log(`[OTP] Codice per ${email}: ${otpCode}`);

    return res.status(200).json({ message: "Se l'email è registrata, riceverai un codice" });
  } catch (err) {
    console.error("Magic link error:", err);
    return res.status(500).json({ message: "Errore durante l'invio" });
  }
}

// Verify OTP code
async function handleVerifyOtp(req, res) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email e codice sono richiesti" });
  }

  try {
    const { data: user } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (!user) {
      return res.status(401).json({ message: "Codice non valido o scaduto" });
    }

    const { data: otp } = await supabase
      .from("admin_otp")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .eq("used", false)
      .single();

    if (!otp) {
      return res.status(401).json({ message: "Codice non valido o scaduto" });
    }

    await supabase.from("admin_otp").update({ used: true }).eq("id", otp.id);

    const crypto = await import("crypto");
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await supabase.from("admin_sessions").insert({
      user_id: user.id,
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    return res.status(200).json({
      token: sessionToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Errore durante la verifica" });
  }
}

// Setup first admin
async function handleSetup(req, res) {
  const { email, name, password, setupKey } = req.body;
  const SETUP_KEY = process.env.ADMIN_SETUP_KEY || "pret-a-bebe-setup-2025";

  if (setupKey !== SETUP_KEY) {
    return res.status(403).json({ message: "Chiave di setup non valida" });
  }

  if (!email || !name || !password) {
    return res.status(400).json({ message: "Email, nome e password sono richiesti" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password minimo 8 caratteri" });
  }

  try {
    const { data: existingAdmins } = await supabase
      .from("admin_users")
      .select("id")
      .eq("role", "admin");

    if (existingAdmins?.length > 0) {
      return res.status(400).json({ message: "Esiste già un admin" });
    }

    const crypto = await import("crypto");
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");

    const { data: newAdmin, error } = await supabase
      .from("admin_users")
      .insert({
        email: email.toLowerCase(),
        name,
        password_hash: passwordHash,
        salt,
        role: "admin",
      })
      .select("id, email, name, role")
      .single();

    if (error) throw error;

    return res.status(201).json({ message: "Admin creato!", user: newAdmin });
  } catch (err) {
    console.error("Setup error:", err);
    return res.status(500).json({ message: "Errore: " + err.message });
  }
}

