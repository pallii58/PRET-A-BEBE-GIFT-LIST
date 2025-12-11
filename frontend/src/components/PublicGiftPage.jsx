import { useEffect, useState } from "react";
import { Card, TextField, Button, Banner, Text } from "@shopify/polaris";
import ProductItemCard from "./ProductItemCard.jsx";

const PublicGiftPage = () => {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/public/gift/${slug}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setData(json);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddToCart = (item) => {
    // Placeholder: here you would call Shopify cart API from storefront
    alert(`Aggiungi variant ${item.variant_id} al carrello`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && <Banner status="critical">{error}</Banner>}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <TextField label="Slug pubblico" value={slug} onChange={setSlug} />
        <Button onClick={load} primary>
          Carica
        </Button>
      </div>
      {data && (
        <Card title={data.title} sectioned>
          <Text tone="subdued">{data.customer_email}</Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.items?.map((item) => (
              <ProductItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PublicGiftPage;

