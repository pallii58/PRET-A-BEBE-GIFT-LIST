import { Card, Badge, Button, InlineStack, Text } from "@shopify/polaris";

const ProductItemCard = ({ item, onAddToCart }) => {
  return (
    <Card>
      <Card.Section>
        <InlineStack align="space-between" blockAlign="center" gap="200">
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
        </InlineStack>
      </Card.Section>
    </Card>
  );
};

export default ProductItemCard;

