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

  return (
    <Card.Section>
      {error && <Banner status="critical">{error}</Banner>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {lists.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ flex: 1 }}>
              <Text variant="headingSm">{item.title}</Text>
              <Text tone="subdued">{item.customer_email}</Text>
            </div>
            <Button onClick={() => loadDetail(item.id)}>Apri</Button>
          </div>
        ))}
      </div>
      {selected && (
        <Card title={`Dettaglio: ${selected.title}`} sectioned>
          <Text tone="subdued">Public URL: /public/gift/{selected.public_url}</Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selected.items?.map((item) => (
              <ProductItemCard key={item.id} item={item} />
            ))}
          </div>
        </Card>
      )}
    </Card.Section>
  );
};

export default ListDashboard;

