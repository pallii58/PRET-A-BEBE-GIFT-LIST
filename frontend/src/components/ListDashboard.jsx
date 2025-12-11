import { useEffect, useState } from "react";
import { Card, Text, Button, Banner } from "@shopify/polaris";
import ProductItemCard from "./ProductItemCard.jsx";

const ListDashboard = () => {
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

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
    try {
      const res = await fetch(`/api/gift_lists/${id}`);
      const data = await res.json();
      setSelected(data);
    } catch (err) {
      setError("Errore nel caricare il dettaglio");
    }
  };

  const openPublicPage = (publicUrl) => {
    // Apri la pagina pubblica in una nuova scheda
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
      {error && <Banner status="critical">{error}</Banner>}
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
          <div style={{ marginBottom: "8px" }}>
            <Text variant="headingXs">Prodotti nella lista ({selected.items?.length || 0}):</Text>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selected.items?.length === 0 && (
              <Text tone="subdued">Nessun prodotto nella lista.</Text>
            )}
            {selected.items?.map((item) => (
              <ProductItemCard key={item.id} item={item} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ListDashboard;

