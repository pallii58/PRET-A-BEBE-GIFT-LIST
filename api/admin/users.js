import supabase from "../_supabase.js";

// Middleware per verificare admin
async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("*, admin_users(*)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session) return null;
  if (session.admin_users.role !== "admin") return null;

  return session.admin_users;
}

export default async function handler(req, res) {
  const admin = await verifyAdmin(req);
  
  if (!admin) {
    return res.status(403).json({ message: "Accesso non autorizzato" });
  }

  // GET - Lista collaboratori
  if (req.method === "GET") {
    try {
      const { data: users, error } = await supabase
        .from("admin_users")
        .select("id, email, name, role, created_at, last_login")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.status(200).json(users);
    } catch (err) {
      console.error("Get users error:", err);
      return res.status(500).json({ message: "Errore nel recupero utenti" });
    }
  }

  // POST - Crea nuovo collaboratore
  if (req.method === "POST") {
    const { email, name, password, role = "collaborator" } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ message: "Email, nome e password sono richiesti" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "La password deve essere di almeno 8 caratteri" });
    }

    try {
      // Verifica che l'email non esista già
      const { data: existing } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existing) {
        return res.status(400).json({ message: "Email già registrata" });
      }

      // Genera salt e hash password
      const crypto = await import("crypto");
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = crypto
        .createHash("sha256")
        .update(password + salt)
        .digest("hex");

      // Crea utente
      const { data: newUser, error } = await supabase
        .from("admin_users")
        .insert({
          email: email.toLowerCase(),
          name,
          password_hash: passwordHash,
          salt,
          role: role === "admin" ? "admin" : "collaborator",
        })
        .select("id, email, name, role, created_at")
        .single();

      if (error) throw error;

      return res.status(201).json(newUser);
    } catch (err) {
      console.error("Create user error:", err);
      return res.status(500).json({ message: "Errore nella creazione utente" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

