import supabase from "./_supabase.js";

// Consolidated admin API - handles user management

async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data: session } = await supabase
    .from("admin_sessions")
    .select("*, admin_users(*)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!session || session.admin_users.role !== "admin") return null;
  return session.admin_users;
}

export default async function handler(req, res) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({ message: "Accesso non autorizzato" });
  }

  const { id } = req.query;

  // GET /api/admin - List users
  if (req.method === "GET" && !id) {
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

  // POST /api/admin - Create user
  if (req.method === "POST" && !id) {
    const { email, name, password, role = "collaborator" } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ message: "Email, nome e password richiesti" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password minimo 8 caratteri" });
    }

    try {
      const { data: existing } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existing) {
        return res.status(400).json({ message: "Email già registrata" });
      }

      const crypto = await import("crypto");
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = crypto
        .createHash("sha256")
        .update(password + salt)
        .digest("hex");

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
      return res.status(500).json({ message: "Errore nella creazione" });
    }
  }

  // PUT /api/admin?id=X - Update user
  if (req.method === "PUT" && id) {
    const { name, role, password } = req.body;

    try {
      const updateData = {};
      if (name) updateData.name = name;
      if (role) updateData.role = role === "admin" ? "admin" : "collaborator";

      if (password) {
        if (password.length < 8) {
          return res.status(400).json({ message: "Password minimo 8 caratteri" });
        }
        const crypto = await import("crypto");
        const salt = crypto.randomBytes(16).toString("hex");
        updateData.password_hash = crypto
          .createHash("sha256")
          .update(password + salt)
          .digest("hex");
        updateData.salt = salt;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Nessun dato da aggiornare" });
      }

      const { data, error } = await supabase
        .from("admin_users")
        .update(updateData)
        .eq("id", id)
        .select("id, email, name, role")
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error("Update user error:", err);
      return res.status(500).json({ message: "Errore nell'aggiornamento" });
    }
  }

  // DELETE /api/admin?id=X - Delete user
  if (req.method === "DELETE" && id) {
    if (parseInt(id) === admin.id) {
      return res.status(400).json({ message: "Non puoi eliminare te stesso" });
    }

    try {
      await supabase.from("admin_sessions").delete().eq("user_id", id);
      await supabase.from("admin_otp").delete().eq("user_id", id);
      await supabase.from("admin_users").delete().eq("id", id);

      return res.status(200).json({ message: "Utente eliminato" });
    } catch (err) {
      console.error("Delete user error:", err);
      return res.status(500).json({ message: "Errore nell'eliminazione" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

