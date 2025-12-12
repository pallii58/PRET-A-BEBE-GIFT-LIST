import supabase from "../../_supabase.js";

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
  const { id } = req.query;
  
  if (!admin) {
    return res.status(403).json({ message: "Accesso non autorizzato" });
  }

  // PUT - Modifica collaboratore
  if (req.method === "PUT") {
    const { name, role, password } = req.body;

    try {
      const updateData = {};
      if (name) updateData.name = name;
      if (role) updateData.role = role === "admin" ? "admin" : "collaborator";

      // Se viene fornita una nuova password
      if (password) {
        if (password.length < 8) {
          return res.status(400).json({ message: "La password deve essere di almeno 8 caratteri" });
        }
        const crypto = await import("crypto");
        const salt = crypto.randomBytes(16).toString("hex");
        const passwordHash = crypto
          .createHash("sha256")
          .update(password + salt)
          .digest("hex");
        updateData.password_hash = passwordHash;
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

  // DELETE - Elimina collaboratore
  if (req.method === "DELETE") {
    // Non permettere di eliminare se stessi
    if (parseInt(id) === admin.id) {
      return res.status(400).json({ message: "Non puoi eliminare il tuo account" });
    }

    try {
      // Elimina sessioni dell'utente
      await supabase
        .from("admin_sessions")
        .delete()
        .eq("user_id", id);

      // Elimina OTP dell'utente
      await supabase
        .from("admin_otp")
        .delete()
        .eq("user_id", id);

      // Elimina utente
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return res.status(200).json({ message: "Utente eliminato" });
    } catch (err) {
      console.error("Delete user error:", err);
      return res.status(500).json({ message: "Errore nell'eliminazione" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

