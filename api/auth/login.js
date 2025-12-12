import supabase from "../_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e password sono richiesti" });
  }

  try {
    // Verifica credenziali nella tabella admin_users
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    // Verifica password (hash comparison)
    const crypto = await import("crypto");
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + user.salt)
      .digest("hex");

    if (hashedPassword !== user.password_hash) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    // Genera token di sessione
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    // Salva sessione
    const { error: sessionError } = await supabase
      .from("admin_sessions")
      .insert({
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) throw sessionError;

    // Aggiorna last_login
    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    return res.status(200).json({
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Errore durante il login" });
  }
}

