import { Badge, Button, Text } from "@shopify/polaris";

const ProductItemCard = ({ item, onAddToCart, onRemove, onMarkAvailable }) => {
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
      {/* Immagine prodotto */}
      {item.product_image ? (
        <img 
          src={item.product_image} 
          alt={item.product_title || "Prodotto"} 
          style={{ 
            width: "60px", 
            height: "60px", 
            objectFit: "contain",
            borderRadius: "6px",
            backgroundColor: "#f9f9f9"
          }} 
        />
      ) : (
        <div style={{ 
          width: "60px", 
          height: "60px", 
          backgroundColor: "#f0f0f0",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px"
        }}>
          📦
        </div>
      )}
      
      <div style={{ flex: 1 }}>
        <Text as="h3" variant="headingSm">
          {item.product_title || `Prodotto #${item.product_id}`}
        </Text>
        <Text as="p" tone="subdued">
          {item.product_price && `€${parseFloat(item.product_price).toFixed(2)} · `}
          Qtà: {item.quantity}
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
      {onMarkAvailable && item.purchased && (
        <Button size="slim" onClick={onMarkAvailable}>
          Rendi disponibile
        </Button>
      )}
      {onRemove && (
        <Button size="slim" destructive onClick={onRemove}>
          Rimuovi
        </Button>
      )}
    </div>
  );
};

export default ProductItemCard;
