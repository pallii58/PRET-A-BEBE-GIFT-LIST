import { Badge, Button, Text } from "@shopify/polaris";

const ProductItemCard = ({ item, onAddToCart, onRemove }) => {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "12px",
      padding: "12px",
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "8px"
    }}>
      <div style={{ flex: 1 }}>
        <Text as="h3" variant="headingSm">
          Product ID: {item.product_id}
        </Text>
        <Text as="p" tone="subdued">
          Variant ID: {item.variant_id} | Quantità: {item.quantity}
        </Text>
      </div>
      <Badge tone={item.purchased ? "success" : "attention"}>
        {item.purchased ? "Acquistato" : "Disponibile"}
      </Badge>
      {onAddToCart && !item.purchased && (
        <Button size="slim" onClick={() => onAddToCart(item)}>
          Aggiungi al carrello
        </Button>
      )}
      {onRemove && (
        <Button size="slim" tone="critical" onClick={onRemove}>
          Rimuovi
        </Button>
      )}
    </div>
  );
};

export default ProductItemCard;
