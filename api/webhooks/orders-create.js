import crypto from "crypto";
import supabase from "../_supabase.js";

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
    const lineItems = payload.line_items || [];
    if (lineItems.length === 0) return res.status(200).send("No items");

    let updatedCount = 0;

    for (const li of lineItems) {
      // Cerca la property _gift_list_item_id nelle properties del line item
      const giftListItemId = li.properties?.find(p => p.name === "_gift_list_item_id")?.value;
      
      if (giftListItemId) {
        // Aggiorna l'item specifico della lista regalo
        const { error } = await supabase
          .from("gift_list_items")
          .update({ purchased: true })
          .eq("id", parseInt(giftListItemId));
        
        if (!error) updatedCount++;
        console.log(`[Webhook] Marked gift list item ${giftListItemId} as purchased`);
      } else {
        // Fallback: cerca per variant_id (potrebbe marcare più items)
        const { error } = await supabase
          .from("gift_list_items")
          .update({ purchased: true })
          .eq("variant_id", String(li.variant_id))
          .eq("purchased", false);
        
        if (!error) updatedCount++;
        console.log(`[Webhook] Marked items with variant ${li.variant_id} as purchased (fallback)`);
      }
    }

    console.log(`[Webhook] Order ${payload.id} processed, ${updatedCount} items updated`);
    return res.status(200).send("ok");
  } catch (err) {
    console.error("Failed to process webhook", err);
    return res.status(500).send("Error");
  }
}
