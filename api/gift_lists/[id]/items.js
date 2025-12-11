import db from "../../_db.js";
import { giftListItemSchema } from "../../_validation.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    const { error, value } = giftListItemSchema.validate(req.body || {}, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details.map((d) => d.message) });
    try {
      const list = await db("gift_lists").where({ id }).first();
      if (!list) return res.status(404).json({ message: "Gift list not found" });
      const [itemId] = await db("gift_list_items").insert({
        ...value,
        gift_list_id: id,
      });
      const item = await db("gift_list_items").where({ id: itemId }).first();
      return res.status(201).json(item);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to add item" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

