import supabase from "../_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email e codice sono richiesti" });
  }

  try {
    // Trova l'utente
    const { data: user, error: userError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (userError || !user) {
      return res.status(401).json({ message: "Codice non valido o scaduto" });
    }

    // Verifica OTP
    const { data: otp, error: otpError } = await supabase
      .from("admin_otp")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .eq("used", false)
      .single();

    if (otpError || !otp) {
      return res.status(401).json({ message: "Codice non valido o scaduto" });
    }

    // Marca OTP come usato
    await supabase
      .from("admin_otp")
      .update({ used: true })
      .eq("id", otp.id);

    // Genera token di sessione
    const crypto = await import("crypto");
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    // Salva sessione
    await supabase
      .from("admin_sessions")
      .insert({
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

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
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Errore durante la verifica" });
  }
}

