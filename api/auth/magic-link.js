import supabase from "../_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email richiesta" });
  }

  try {
    // Verifica che l'utente esista
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      // Non rivelare se l'email esiste o meno per sicurezza
      return res.status(200).json({ 
        message: "Se l'email è registrata, riceverai un link di accesso" 
      });
    }

    // Genera OTP code
    const crypto = await import("crypto");
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 cifre
    const otpToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minuti

    // Salva OTP
    await supabase
      .from("admin_otp")
      .insert({
        user_id: user.id,
        code: otpCode,
        token: otpToken,
        expires_at: expiresAt.toISOString(),
      });

    // In produzione, qui invieremmo l'email con il codice OTP
    // Per ora, logghiamo il codice (da rimuovere in produzione!)
    console.log(`[OTP] Codice per ${email}: ${otpCode}`);

    // TODO: Inviare email con il codice OTP
    // Puoi usare Resend, SendGrid, o altri servizi email gratuiti

    return res.status(200).json({ 
      message: "Se l'email è registrata, riceverai un codice di accesso",
      // In dev, restituiamo il token per il secondo step
      _devToken: otpToken,
    });
  } catch (err) {
    console.error("Magic link error:", err);
    return res.status(500).json({ message: "Errore durante l'invio" });
  }
}

