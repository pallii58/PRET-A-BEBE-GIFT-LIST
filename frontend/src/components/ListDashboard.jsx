import { useEffect, useState } from "react";
import { Card, Text, Button, Banner, TextField } from "@shopify/polaris";
import ProductItemCard from "./ProductItemCard.jsx";

const ListDashboard = () => {
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form per aggiungere prodotto
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [adding, setAdding] = useState(false);

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

  const loadDetail = async (id) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/gift_lists/${id}`);
      const data = await res.json();
      setSelected(data);
    } catch (err) {
      setError("Errore nel caricare il dettaglio");
    }
  };

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
      // Ricarica i dettagli della lista
      loadDetail(selected.id);
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
      loadDetail(selected.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const openPublicPage = (publicUrl) => {
    const url = `https://pret-a-bebe-gift-list.vercel.app/public/gift/${publicUrl}`;
    window.open(url, "_blank");
  };

  const copyPublicUrl = (publicUrl) => {
    const url = `https://pret-a-bebe-gift-list.vercel.app/public/gift/${publicUrl}`;
    navigator.clipboard.writeText(url);
    alert("URL copiato negli appunti!");
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
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={() => loadDetail(item.id)}>Dettagli</Button>
              <Button primary onClick={() => openPublicPage(item.public_url)}>
                Apri pagina
              </Button>
              <Button onClick={() => copyPublicUrl(item.public_url)}>
                Copia URL
              </Button>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <Card title={`Dettaglio: ${selected.title}`} sectioned>
          <div style={{ marginBottom: "16px" }}>
            <Text variant="headingXs">Email cliente:</Text>
            <Text>{selected.customer_email}</Text>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <Text variant="headingXs">URL pubblico:</Text>
            <Text tone="subdued">
              <a 
                href={`https://pret-a-bebe-gift-list.vercel.app/public/gift/${selected.public_url}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                https://pret-a-bebe-gift-list.vercel.app/public/gift/{selected.public_url}
              </a>
            </Text>
          </div>
          
          {/* Form per aggiungere prodotto */}
          <div style={{ 
            marginBottom: "24px", 
            padding: "16px", 
            backgroundColor: "#f9f9f9", 
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}>
            <Text variant="headingXs">Aggiungi prodotto alla lista:</Text>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <TextField
                  label="Product ID"
                  value={productId}
                  onChange={setProductId}
                  placeholder="es. 1234567890"
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <TextField
                  label="Variant ID"
                  value={variantId}
                  onChange={setVariantId}
                  placeholder="es. 9876543210"
                />
              </div>
              <div style={{ width: "80px" }}>
                <TextField
                  label="Qtà"
                  type="number"
                  value={quantity}
                  onChange={setQuantity}
                  min="1"
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <Button primary onClick={addProduct} loading={adding}>
                  Aggiungi
                </Button>
              </div>
            </div>
            <Text tone="subdued" variant="bodySm">
              Trova Product ID e Variant ID nell'URL del prodotto su Shopify Admin.
            </Text>
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <Text variant="headingXs">Prodotti nella lista ({selected.items?.length || 0}):</Text>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selected.items?.length === 0 && (
              <Text tone="subdued">Nessun prodotto nella lista.</Text>
            )}
            {selected.items?.map((item) => (
              <ProductItemCard 
                key={item.id} 
                item={item} 
                onRemove={() => removeProduct(item.id)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ListDashboard;

