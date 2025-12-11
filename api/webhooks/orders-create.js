import crypto from "crypto";
import db from "../_db.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = [];
    req.on("data", (chunk) => data.push(chunk));
    req.on("end", () => resolve(Buffer.concat(data)));
    req.on("error", (err) => reject(err));
  });

const verifyHmac = (rawBody, hmac, secret) => {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
  } catch {
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const hmacHeader = req.headers["x-shopify-hmac-sha256"];
  if (!hmacHeader) return res.status(401).send("Missing HMAC");
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).send("Missing webhook secret");

  let rawBody;
  try {
    rawBody = await readBody(req);
  } catch (err) {
    console.error("Failed to read body", err);
    return res.status(400).send("Invalid body");
  }

  if (!verifyHmac(rawBody, hmacHeader, secret)) return res.status(401).send("Invalid signature");

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch (err) {
    console.error("Invalid JSON", err);
    return res.status(400).send("Invalid JSON");
  }

  try {
    const variantIds = payload.line_items?.map((li) => String(li.variant_id)) || [];
    if (variantIds.length === 0) return res.status(200).send("No items");

    await db("gift_list_items").whereIn("variant_id", variantIds).update({ purchased: true });
    return res.status(200).send("ok");
  } catch (err) {
    console.error("Failed to process webhook", err);
    return res.status(500).send("Error");
  }
}

