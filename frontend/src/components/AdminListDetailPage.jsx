import { useEffect, useState } from "react";
import { Card, Text, Button, Banner } from "@shopify/polaris";
import ProductItemCard from "./ProductItemCard.jsx";

const AdminListDetailPage = ({ listId }) => {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDetail = async () => {
    if (!listId) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/gift_lists/${listId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Errore nel caricare il dettaglio");
      setList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  const removeProduct = async (itemId) => {
    if (!list) return;
    setError(null);
    try {
      const res = await fetch(`/api/gift_lists/${list.id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Errore nella rimozione");
      setSuccess("Prodotto rimosso dalla lista!");
      await loadDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = () => {
    if (!list) return;
    setEditTitle(list.title || "");
    setEditEmail(list.customer_email || "");
    setEditModalOpen(true);
  };

  const saveListChanges = async () => {
    if (!list) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/gift_lists/${list.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          customer_email: editEmail,
        }),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      setSuccess("Lista aggiornata con successo!");
      setEditModalOpen(false);
      await loadDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  const deleteList = async () => {
    if (!list) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/gift_lists/${list.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      setDeleting(false);
      // Torna indietro alla dashboard dopo eliminazione
      window.history.back();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (!list) {
    return (
      <div style={{ maxWidth: 1200, margin: "20px 0", padding: "12px" }}>
        {error && (
          <Banner status="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}
        {!error && <Text>Caricamento lista...</Text>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "20px 0", padding: "12px" }}>
      {/* Header con back */}
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ marginBottom: "30px" }}>
            <Button onClick={() => window.history.back()}>
              &larr; Torna alle liste
            </Button>
          </div>
          <Text as="h1" variant="headingLg">
            Dettaglio lista
          </Text>
          <Text tone="subdued">{list.title}</Text>
        </div>
      </div>

      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      {success && (
        <Banner status="success" onDismiss={() => setSuccess(null)}>
          {success}
        </Banner>
      )}

      <Card title={`Dettaglio: ${list.title}`} sectioned>
        <div style={{ marginBottom: "16px" }}>
          <Text variant="headingXs">Email cliente:</Text>
          <Text>{list.customer_email}</Text>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <Text variant="headingXs">URL pubblico:</Text>
          <Text tone="subdued">
            <a
              href={`https://giftlist.pretabebe.it/lista/${list.public_url}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              https://giftlist.pretabebe.it/lista/{list.public_url}
            </a>
          </Text>
        </div>

        {/* Bottoni modifica/elimina nel dettaglio */}
        <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
          <Button onClick={openEditModal}>Modifica lista</Button>
          <Button destructive onClick={openDeleteModal}>
            Elimina lista
          </Button>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <Text variant="headingXs">
            Prodotti nella lista ({list.items?.length || 0}):
          </Text>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {list.items?.length === 0 && (
            <Text tone="subdued">Nessun prodotto nella lista.</Text>
          )}
          {list.items?.map((item) => (
            <ProductItemCard
              key={item.id}
              item={item}
              onRemove={() => removeProduct(item.id)}
            />
          ))}
        </div>
      </Card>

      {/* Modal Modifica Lista */}
      {editModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <Text variant="headingLg">Modifica Lista</Text>
            <div style={{ marginTop: "16px", marginBottom: "16px" }}>
              <TextField
                label="Nome della lista"
                value={editTitle}
                onChange={setEditTitle}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <TextField
                label="Email cliente"
                value={editEmail}
                onChange={setEditEmail}
                type="email"
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Button onClick={() => setEditModalOpen(false)}>Annulla</Button>
              <Button primary onClick={saveListChanges} loading={saving}>
                Salva modifiche
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <Text variant="headingLg">Conferma eliminazione</Text>
            <div style={{ marginTop: "16px", marginBottom: "24px" }}>
              <Text>
                Sei sicuro di voler eliminare la lista "<strong>{list.title}</strong>"? Questa azione è
                irreversibile e rimuoverà anche tutti i prodotti associati.
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

export default AdminListDetailPage;



