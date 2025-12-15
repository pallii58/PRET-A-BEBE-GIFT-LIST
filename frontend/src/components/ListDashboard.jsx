import { useEffect, useState } from "react";
import { Card, Text, Button, Banner, TextField, Modal } from "@shopify/polaris";
import ProductItemCard from "./ProductItemCard.jsx";

const ListDashboard = ({ onOpenDetail }) => {
  const [lists, setLists] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form per aggiungere prodotto
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [adding, setAdding] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingList, setDeletingList] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchLists = async () => {
    try {
      const res = await fetch("/api/gift_lists");
      const data = await res.json();
      setLists(data);
    } catch (err) {
      setError("Errore nel caricare le liste");
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const addProduct = async () => {
    if (!selected || !productId || !variantId) {
      setError("Inserisci Product ID e Variant ID");
      return;
    }
    setAdding(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/gift_lists/${selected.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId,
          quantity: parseInt(quantity) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.join(", ") || data.message);
      setSuccess("Prodotto aggiunto alla lista!");
      setProductId("");
      setVariantId("");
      setQuantity("1");
      // Ricarica le liste
      fetchLists();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const removeProduct = async (itemId) => {
    if (!selected) return;
    setError(null);
    try {
      const res = await fetch(`/api/gift_lists/${selected.id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Errore nella rimozione");
      setSuccess("Prodotto rimosso dalla lista!");
      fetchLists();
    } catch (err) {
      setError(err.message);
    }
  };

  const openPublicPage = (publicUrl) => {
    const url = `https://giftlist.pretabebe.it/lista/${publicUrl}`;
    window.open(url, "_blank");
  };

  const copyPublicUrl = (id, publicUrl) => {
    const url = `https://giftlist.pretabebe.it/lista/${publicUrl}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Apri modal conferma eliminazione
  const openDeleteModal = (list) => {
    setDeletingList(list);
    setDeleteModalOpen(true);
  };

  // Elimina lista
  const deleteList = async () => {
    if (!deletingList) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/gift_lists/${deletingList.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      setSuccess("Lista eliminata con successo!");
      setDeleteModalOpen(false);
      setDeletingList(null);
      if (selected && selected.id === deletingList.id) {
        setSelected(null);
      }
      fetchLists();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && <Banner status="critical" onDismiss={() => setError(null)}>{error}</Banner>}
      {success && <Banner status="success" onDismiss={() => setSuccess(null)}>{success}</Banner>}
      {lists.length === 0 && !error && (
        <Text tone="subdued">Nessuna lista creata. Vai su "Crea lista" per crearne una.</Text>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {lists.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderBottom: "1px solid #eee",
              backgroundColor: "#fafafa",
              borderRadius: "8px",
            }}
          >
            <div style={{ flex: 1 }}>
              <Text variant="headingSm">{item.title}</Text>
              <Text tone="subdued">{item.customer_email}</Text>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Button onClick={() => (onOpenDetail ? onOpenDetail(item.id) : null)}>Dettagli</Button>
              <Button primary onClick={() => openPublicPage(item.public_url)}>
                Apri pagina
              </Button>
              <Button onClick={() => copyPublicUrl(item.id, item.public_url)}>
                {copiedId === item.id ? "Copiato!" : "Copia URL"}
              </Button>
              <Button onClick={() => (window.location.href = `/create?edit=${item.id}`)}>
                Modifica
              </Button>
              <Button destructive onClick={() => openDeleteModal(item)}>
                Elimina
              </Button>
            </div>
          </div>
        ))}
      </div>
      {/* Dettaglio lista spostato in una pagina dedicata (/admin/list/:id) */}

      {/* Modal Conferma Eliminazione */}
      {deleteModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}>
            <Text variant="headingLg">Conferma eliminazione</Text>
            <div style={{ marginTop: "16px", marginBottom: "24px" }}>
              <Text>
                Sei sicuro di voler eliminare la lista "<strong>{deletingList?.title}</strong>"? 
                Questa azione è irreversibile e rimuoverà anche tutti i prodotti associati.
              </Text>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Button onClick={() => setDeleteModalOpen(false)}>Annulla</Button>
              <Button destructive onClick={deleteList} loading={deleting}>
                Elimina lista
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListDashboard;

