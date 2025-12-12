import crypto from "crypto";
import supabase from "../_supabase.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

// Aggiunge tag all'ordine via Shopify Admin API
const addTagsToOrder = async (orderId, tags) => {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    console.log("[Webhook] Missing Shopify credentials, skipping tag update");
    return;
  }

  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/orders/${orderId}.json`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
        },
        body: JSON.stringify({
          order: {
            id: orderId,
            tags: tags.join(", "),
          },
        }),
      }
    );

    if (response.ok) {
      console.log(`[Webhook] Added tags to order ${orderId}: ${tags.join(", ")}`);
    } else {
      const error = await response.text();
      console.error(`[Webhook] Failed to add tags to order ${orderId}:`, error);
    }
  } catch (err) {
    console.error(`[Webhook] Error adding tags to order ${orderId}:`, err);
  }
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
    const giftListNames = new Set(); // Raccoglie i nomi delle liste per i tag

    for (const li of lineItems) {
      // Cerca le properties della lista regalo nel line item
      const giftListItemId = li.properties?.find(p => p.name === "_gift_list_item_id")?.value;
      const giftListName = li.properties?.find(p => p.name === "_gift_list_name")?.value;
      
      if (giftListName) {
        giftListNames.add(`Lista Regalo: ${giftListName}`);
      }
      
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

    // Aggiungi tag all'ordine con i nomi delle liste regalo
    if (giftListNames.size > 0) {
      const existingTags = payload.tags ? payload.tags.split(", ") : [];
      const allTags = [...existingTags, ...Array.from(giftListNames)];
      await addTagsToOrder(payload.id, allTags);
    }

    console.log(`[Webhook] Order ${payload.id} processed, ${updatedCount} items updated`);
    return res.status(200).send("ok");
  } catch (err) {
    console.error("Failed to process webhook", err);
    return res.status(500).send("Error");
  }
}
