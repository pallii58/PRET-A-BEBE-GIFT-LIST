import db from "../../../_db.js";

export default async function handler(req, res) {
  const { id, itemId } = req.query;

  if (req.method === "DELETE") {
    try {
      const deleted = await db("gift_list_items").where({ id: itemId, gift_list_id: id }).del();
      if (!deleted) return res.status(404).json({ message: "Item not found" });
      return res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to delete item" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

