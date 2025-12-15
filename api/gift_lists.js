import supabase from "./_supabase.js";
import { giftListSchema } from "./_validation.js";

const slugify = (title) => {
  return title
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const generatePublicUrl = async (title) => {
  const baseSlug = slugify(title) || "lista-regali";
  let slug = baseSlug;
  let counter = 2;

  // Ensure uniqueness by checking existing records with same public_url
  // (simple loop, should be fine given low volume of creations)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("gift_lists")
      .select("id")
      .eq("public_url", slug)
      .limit(1);

    if (error) {
      // In caso di errore DB, fallback a slug corrente per non bloccare la creazione
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { error, value } = giftListSchema.validate(req.body || {}, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details.map((d) => d.message) });
    const { title, customer_email } = value;
    try {
      const public_url = await generatePublicUrl(title);
      const { data, error: dbError } = await supabase
        .from("gift_lists")
        .insert({
          title,
          customer_email,
          public_url,
          shop_domain: req.headers["x-shop-domain"] || "unknown",
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      return res.status(201).json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to create gift list" });
    }
  }

  if (req.method === "GET") {
    try {
      const { data, error: dbError } = await supabase
        .from("gift_lists")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (dbError) throw dbError;
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch gift lists" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
