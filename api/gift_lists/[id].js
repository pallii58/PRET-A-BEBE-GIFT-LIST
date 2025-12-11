import supabase from "../_supabase.js";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "GET") {
    try {
      const { data: list, error: listError } = await supabase
        .from("gift_lists")
        .select("*")
        .eq("id", id)
        .single();
      
      if (listError || !list) return res.status(404).json({ message: "Not found" });
      
      const { data: items, error: itemsError } = await supabase
        .from("gift_list_items")
        .select("*")
        .eq("gift_list_id", id);
      
      if (itemsError) throw itemsError;
      
      return res.json({ ...list, items: items || [] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch gift list" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
