// API per ottenere i prodotti più richiesti (più selezionati nelle liste regalo)
import supabase from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Conta quante volte ogni product_id appare nelle liste regalo
    const { data, error } = await supabase
      .from("gift_list_items")
      .select("product_id");

    if (error) throw error;

    // Conta le occorrenze di ogni product_id
    const counts = {};
    data.forEach(item => {
      counts[item.product_id] = (counts[item.product_id] || 0) + 1;
    });

    // Ritorna un oggetto con product_id -> count
    return res.status(200).json(counts);
  } catch (error) {
    console.error("Error fetching popular products:", error);
    return res.status(500).json({ message: "Failed to fetch popular products" });
  }
}


