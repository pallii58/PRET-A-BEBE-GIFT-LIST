import express from "express";
import crypto from "crypto";
import db from "../db/connection.js";
import { giftListSchema, giftListItemSchema } from "../utils/validation.js";

const router = express.Router();

const generatePublicUrl = () => crypto.randomBytes(6).toString("hex");

router.post("/gift_lists", async (req, res) => {
  const { error, value } = giftListSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ errors: error.details.map((d) => d.message) });

  const { title, customer_email } = value;
  try {
    const public_url = generatePublicUrl();
    const [id] = await db("gift_lists").insert({
      title,
      customer_email,
      public_url,
      shop_domain: req.shop || "unknown",
    });
    const list = await db("gift_lists").where({ id }).first();
    res.status(201).json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create gift list" });
  }
});

router.get("/gift_lists", async (_req, res) => {
  try {
    const lists = await db("gift_lists").orderBy("created_at", "desc");
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch gift lists" });
  }
});

router.get("/gift_lists/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const list = await db("gift_lists").where({ id }).first();
    if (!list) return res.status(404).json({ message: "Not found" });
    const items = await db("gift_list_items").where({ gift_list_id: id });
    res.json({ ...list, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch gift list" });
  }
});

router.post("/gift_lists/:id/items", async (req, res) => {
  const { id } = req.params;
  const { error, value } = giftListItemSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ errors: error.details.map((d) => d.message) });
  try {
    const list = await db("gift_lists").where({ id }).first();
    if (!list) return res.status(404).json({ message: "Gift list not found" });
    const [itemId] = await db("gift_list_items").insert({
      ...value,
      gift_list_id: id,
    });
    const item = await db("gift_list_items").where({ id: itemId }).first();
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add item" });
  }
});

router.delete("/gift_lists/:id/items/:itemId", async (req, res) => {
  const { id, itemId } = req.params;
  try {
    const deleted = await db("gift_list_items")
      .where({ id: itemId, gift_list_id: id })
      .del();
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete item" });
  }
});

export default router;

