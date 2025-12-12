import supabase from "../_supabase.js";

// Endpoint per creare il primo admin
// Funziona solo se non esistono utenti admin!

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, name, password, setupKey } = req.body;

  // Chiave di setup per sicurezza (impostala in Vercel env vars)
  const SETUP_KEY = process.env.ADMIN_SETUP_KEY || "pret-a-bebe-setup-2025";
  
  if (setupKey !== SETUP_KEY) {
    return res.status(403).json({ message: "Chiave di setup non valida" });
  }

  if (!email || !name || !password) {
    return res.status(400).json({ message: "Email, nome e password sono richiesti" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "La password deve essere di almeno 8 caratteri" });
  }

  try {
    // Verifica che non esistano già admin
    const { data: existingAdmins, error: checkError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("role", "admin");

    if (checkError) {
      console.error("Check error:", checkError);
      // Potrebbe essere che la tabella non esiste ancora
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return res.status(400).json({ 
        message: "Esiste già un admin. Usa il pannello per creare altri utenti." 
      });
    }

    // Genera salt e hash password
    const crypto = await import("crypto");
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");

    // Crea admin
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

    if (error) {
      console.error("Create admin error:", error);
      throw error;
    }

    return res.status(201).json({
      message: "Admin creato con successo!",
      user: newAdmin,
    });
  } catch (err) {
    console.error("Setup error:", err);
    return res.status(500).json({ message: "Errore durante la creazione: " + err.message });
  }
}

