import db from "../_db.js";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "GET") {
    try {
      const list = await db("gift_lists").where({ id }).first();
      if (!list) return res.status(404).json({ message: "Not found" });
      const items = await db("gift_list_items").where({ gift_list_id: id });
      return res.json({ ...list, items });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch gift list" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

