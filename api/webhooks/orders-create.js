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
  console.log(`[Webhook] addTagsToOrder called - orderId: ${orderId}, tags: ${tags.join(", ")}`);
  console.log(`[Webhook] SHOPIFY_STORE_DOMAIN: ${SHOPIFY_STORE_DOMAIN ? "SET" : "MISSING"}`);
  console.log(`[Webhook] SHOPIFY_ADMIN_TOKEN: ${SHOPIFY_ADMIN_TOKEN ? "SET" : "MISSING"}`);
  
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    console.log("[Webhook] Missing Shopify credentials, skipping tag update");
    return;
  }

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/orders/${orderId}.json`;
  console.log(`[Webhook] API URL: ${url}`);

  try {
    const response = await fetch(url, {
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
    });

    const responseText = await response.text();
    console.log(`[Webhook] Shopify API response status: ${response.status}`);
    console.log(`[Webhook] Shopify API response: ${responseText}`);

    if (response.ok) {
      console.log(`[Webhook] SUCCESS - Added tags to order ${orderId}: ${tags.join(", ")}`);
    } else {
      console.error(`[Webhook] FAILED to add tags to order ${orderId}:`, responseText);
    }
  } catch (err) {
    console.error(`[Webhook] ERROR adding tags to order ${orderId}:`, err.message);
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
    console.log(`[Webhook] Processing order ${payload.id}`);
    const lineItems = payload.line_items || [];
    console.log(`[Webhook] Line items count: ${lineItems.length}`);
    
    if (lineItems.length === 0) return res.status(200).send("No items");

    let updatedCount = 0;
    const giftListNames = new Set(); // Raccoglie i nomi delle liste per i tag

    for (const li of lineItems) {
      console.log(`[Webhook] Line item: variant_id=${li.variant_id}, properties=${JSON.stringify(li.properties)}`);
      // Cerca il nome della lista regalo nel line item
      const giftListName = li.properties?.find(p => p.name === "Lista Regalo")?.value;
      console.log(`[Webhook] Found gift list name: ${giftListName || "NONE"}`);
      
      if (giftListName) {
        giftListNames.add(giftListName);
        
        // Marca come acquistato l'item con questo variant_id nella lista con questo nome
        const { error } = await supabase
          .from("gift_list_items")
          .update({ purchased: true })
          .eq("variant_id", String(li.variant_id))
          .eq("purchased", false);
        
        if (!error) updatedCount++;
        console.log(`[Webhook] Marked variant ${li.variant_id} as purchased for list "${giftListName}"`);
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
