import { useEffect, useState } from "react";
import { Card, TextField, Button, Banner, HorizontalStack, BlockStack, Text } from "@shopify/polaris";
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
    <Card.Section>
      {error && <Banner status="critical">{error}</Banner>}
      <HorizontalStack gap="200" blockAlign="center">
        <TextField label="Slug pubblico" value={slug} onChange={setSlug} />
        <Button onClick={load} primary>
          Carica
        </Button>
      </HorizontalStack>
      {data && (
        <Card title={data.title} sectioned>
          <Text tone="subdued">{data.customer_email}</Text>
          <BlockStack gap="200">
            {data.items?.map((item) => (
              <ProductItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
            ))}
          </BlockStack>
        </Card>
      )}
    </Card.Section>
  );
};

export default PublicGiftPage;

