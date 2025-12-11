import db from "../../_db.js";

export default async function handler(req, res) {
  const { publicUrl } = req.query;
  if (req.method === "GET") {
    try {
      const list = await db("gift_lists").where({ public_url: publicUrl }).first();
      if (!list) return res.status(404).json({ message: "Gift list not found" });
      const items = await db("gift_list_items").where({ gift_list_id: list.id });
      return res.json({ ...list, items });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to load gift list" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

