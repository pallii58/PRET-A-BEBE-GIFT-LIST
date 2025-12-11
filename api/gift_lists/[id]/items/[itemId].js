import supabase from "../../../_supabase.js";

export default async function handler(req, res) {
  const { id, itemId } = req.query;

  if (req.method === "DELETE") {
    try {
      const { data, error: deleteError } = await supabase
        .from("gift_list_items")
        .delete()
        .eq("id", itemId)
        .eq("gift_list_id", id)
        .select();
      
      if (deleteError) throw deleteError;
      if (!data || data.length === 0) return res.status(404).json({ message: "Item not found" });
      
      return res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to delete item" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
