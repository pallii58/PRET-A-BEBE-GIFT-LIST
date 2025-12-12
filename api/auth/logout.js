import supabase from "../_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(200).json({ message: "Logout effettuato" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Elimina sessione
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("token", token);

    return res.status(200).json({ message: "Logout effettuato" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(200).json({ message: "Logout effettuato" });
  }
}

