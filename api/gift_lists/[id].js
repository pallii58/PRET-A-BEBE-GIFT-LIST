import supabase from "../_supabase.js";

export default async function handler(req, res) {
  const { id } = req.query;

  // GET - Ottieni dettagli lista
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

  // PUT - Modifica lista
  if (req.method === "PUT") {
    try {
      const { title, customer_email } = req.body;
      
      const updateData = {};
      if (title) updateData.title = title;
      if (customer_email) updateData.customer_email = customer_email;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Nessun dato da aggiornare" });
      }
      
      const { data, error } = await supabase
        .from("gift_lists")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) return res.status(404).json({ message: "Lista non trovata" });
      
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Errore nell'aggiornamento della lista" });
    }
  }

  // DELETE - Elimina lista
  if (req.method === "DELETE") {
    try {
      // Prima elimina tutti gli items della lista
      const { error: itemsError } = await supabase
        .from("gift_list_items")
        .delete()
        .eq("gift_list_id", id);
      
      if (itemsError) throw itemsError;
      
      // Poi elimina la lista
      const { error: listError } = await supabase
        .from("gift_lists")
        .delete()
        .eq("id", id);
      
      if (listError) throw listError;
      
      return res.json({ message: "Lista eliminata con successo" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Errore nell'eliminazione della lista" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
