import { Card, Badge, Button, Stack, Text } from "@shopify/polaris";

const ProductItemCard = ({ item, onAddToCart }) => {
  return (
    <Card>
      <Card.Section>
        <Stack alignment="center">
          <Stack.Item fill>
            <Text as="h3" variant="headingMd">
              Variant {item.variant_id}
            </Text>
            <Text as="p" tone="subdued">
              Qty: {item.quantity}
            </Text>
          </Stack.Item>
          <Badge tone={item.purchased ? "success" : "attention"}>
            {item.purchased ? "Acquistato" : "Disponibile"}
          </Badge>
          {!item.purchased && (
            <Button size="slim" onClick={() => onAddToCart?.(item)}>
              Aggiungi al carrello
            </Button>
          )}
        </Stack>
      </Card.Section>
    </Card>
  );
};

export default ProductItemCard;

