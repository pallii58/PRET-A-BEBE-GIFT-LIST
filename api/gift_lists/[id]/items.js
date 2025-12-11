import supabase from "../../_supabase.js";
import { giftListItemSchema } from "../../_validation.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    const { error, value } = giftListItemSchema.validate(req.body || {}, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details.map((d) => d.message) });
    try {
      // Check if list exists
      const { data: list, error: listError } = await supabase
        .from("gift_lists")
        .select("id")
        .eq("id", id)
        .single();
      
      if (listError || !list) return res.status(404).json({ message: "Gift list not found" });
      
      // Insert item
      const { data: item, error: insertError } = await supabase
        .from("gift_list_items")
        .insert({
          ...value,
          gift_list_id: id,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      return res.status(201).json(item);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to add item" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
