import crypto from "crypto";
import db from "./_db.js";
import { giftListSchema } from "./_validation.js";

const generatePublicUrl = () => crypto.randomBytes(6).toString("hex");

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { error, value } = giftListSchema.validate(req.body || {}, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details.map((d) => d.message) });
    const { title, customer_email } = value;
    try {
      const public_url = generatePublicUrl();
      const [id] = await db("gift_lists").insert({
        title,
        customer_email,
        public_url,
        shop_domain: req.headers["x-shop-domain"] || "unknown",
      });
      const list = await db("gift_lists").where({ id }).first();
      return res.status(201).json(list);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to create gift list" });
    }
  }

  if (req.method === "GET") {
    try {
      const lists = await db("gift_lists").orderBy("created_at", "desc");
      return res.json(lists);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch gift lists" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

