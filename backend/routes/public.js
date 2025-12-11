import express from "express";
import db from "../db/connection.js";

const router = express.Router();

router.get("/gift/:publicUrl", async (req, res) => {
  const { publicUrl } = req.params;
  try {
    const list = await db("gift_lists").where({ public_url: publicUrl }).first();
    if (!list) return res.status(404).json({ message: "Gift list not found" });
    const items = await db("gift_list_items").where({ gift_list_id: list.id });
    res.json({ ...list, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load gift list" });
  }
});

export default router;

