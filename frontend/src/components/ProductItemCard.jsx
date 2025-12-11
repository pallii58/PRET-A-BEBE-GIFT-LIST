import { Card, Badge, Button, Text } from "@shopify/polaris";

const ProductItemCard = ({ item, onAddToCart }) => {
  return (
    <Card>
      <Card.Section>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <Text as="h3" variant="headingMd">
              Variant {item.variant_id}
            </Text>
            <Text as="p" tone="subdued">
              Qty: {item.quantity}
            </Text>
          </div>
          <Badge tone={item.purchased ? "success" : "attention"}>
            {item.purchased ? "Acquistato" : "Disponibile"}
          </Badge>
          {!item.purchased && (
            <Button size="slim" onClick={() => onAddToCart?.(item)}>
              Aggiungi al carrello
            </Button>
          )}
        </div>
      </Card.Section>
    </Card>
  );
};

export default ProductItemCard;

