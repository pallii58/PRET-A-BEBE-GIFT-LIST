import express from "express";
import crypto from "crypto";
import db from "../db/connection.js";

const router = express.Router();

const verifyHmac = (rawBody, hmac, secret) => {
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
};

router.post("/orders-create", express.raw({ type: "application/json" }), async (req, res) => {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  if (!hmacHeader) return res.status(401).send("Missing HMAC");
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).send("Missing webhook secret");
  const rawBody = req.body.toString();
  if (!verifyHmac(rawBody, hmacHeader, secret)) return res.status(401).send("Invalid signature");

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("Invalid JSON", err);
    return res.status(400).send("Invalid JSON");
  }

  try {
    const variantIds = payload.line_items?.map((li) => String(li.variant_id)) || [];
    if (variantIds.length === 0) return res.status(200).send("No items");

    await db("gift_list_items")
      .whereIn("variant_id", variantIds)
      .update({ purchased: true });

    res.status(200).send("ok");
  } catch (err) {
    console.error("Failed to process webhook", err);
    res.status(500).send("Error");
  }
});

export default router;

