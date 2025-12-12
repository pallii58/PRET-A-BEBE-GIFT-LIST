import supabase from "../_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token mancante" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Verifica sessione
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

