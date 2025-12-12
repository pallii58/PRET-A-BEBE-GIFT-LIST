import { useState, useEffect } from "react";

const ViewGiftListPage = ({ publicUrl }) => {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadList();
  }, [publicUrl]);

  const loadList = async () => {
    if (!publicUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/gift/${publicUrl}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lista non trovata");
      setList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    // Apri il prodotto su pretabebe.com con il variant nel carrello
    // Aggiungi properties per tracciare la lista regalo
    const properties = encodeURIComponent(`properties[_gift_list_id]=${list.id}&properties[_gift_list_name]=${list.title}&properties[_gift_list_item_id]=${item.id}`);
    const shopUrl = `https://www.pretabebe.com/cart/add?id=${item.variant_id}&quantity=${item.quantity}&${properties}`;
    window.open(shopUrl, "_blank");
  };

  const openProduct = (item) => {
    // Apri la pagina prodotto con parametri per tracciare la lista
    const url = `https://www.pretabebe.com/products/${item.product_handle}?gift_list=${list.id}&gift_list_item=${item.id}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.logo}>PRET A BEBÈ</h1>
          <p style={styles.subtitle}>Lista Regali</p>
        </div>
        <div style={styles.content}>
          <div style={styles.card}>
            <p style={styles.loading}>Caricamento lista...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.logo}>PRET A BEBÈ</h1>
          <p style={styles.subtitle}>Lista Regali</p>
        </div>
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.errorIcon}>😔</div>
            <h2 style={styles.title}>Lista non trovata</h2>
            <p style={styles.description}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const availableItems = list?.items?.filter((i) => !i.purchased) || [];
  const purchasedItems = list?.items?.filter((i) => i.purchased) || [];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>PRET A BEBÈ</h1>
        <p style={styles.subtitle}>Lista Regali</p>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.giftIcon}>🎁</div>
          <h2 style={styles.title}>{list?.title}</h2>
          <p style={styles.description}>
            Ecco la lista dei desideri! Scegli un regalo da acquistare 
            e renderai felice qualcuno di speciale.
          </p>

          {/* Prodotti disponibili */}
          {availableItems.length > 0 && (
            <>
              <h3 style={styles.sectionTitle}>
                Regali disponibili ({availableItems.length})
              </h3>
              <div style={styles.itemsGrid}>
                {availableItems.map((item) => (
                  <div key={item.id} style={styles.itemCard}>
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_title} style={styles.itemImageImg} />
                    ) : (
                      <div style={styles.itemImage}>🎀</div>
                    )}
                    <div style={styles.itemInfo}>
                      <h4 style={styles.itemTitle}>{item.product_title || `Prodotto #${item.product_id}`}</h4>
                      {item.product_price && (
                        <p style={styles.itemPrice}>€{parseFloat(item.product_price).toFixed(2)}</p>
                      )}
                    </div>
                    <div style={styles.itemActions}>
                      {item.product_handle && (
                        <button
                          style={styles.discoverButton}
                          onClick={() => openProduct(item)}
                        >
                          Scopri di più
                        </button>
                      )}
                      <button
                        style={styles.buyButton}
                        onClick={() => addToCart(item)}
                      >
                        Regala questo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Prodotti già acquistati */}
          {purchasedItems.length > 0 && (
            <>
              <h3 style={styles.sectionTitle}>
                Già regalati ({purchasedItems.length})
              </h3>
              <div style={styles.itemsGrid}>
                {purchasedItems.map((item) => (
                  <div key={item.id} style={styles.itemCardPurchased}>
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_title} style={styles.itemImageImgPurchased} />
                    ) : (
                      <div style={styles.itemImage}>✅</div>
                    )}
                    <div style={styles.itemInfo}>
                      <h4 style={styles.itemTitle}>{item.product_title || `Prodotto #${item.product_id}`}</h4>
                      {item.product_price && (
                        <p style={styles.itemPrice}>€{parseFloat(item.product_price).toFixed(2)}</p>
                      )}
                    </div>
                    <span style={styles.purchasedBadge}>Già regalato!</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {list?.items?.length === 0 && (
            <p style={styles.emptyMessage}>
              Questa lista non ha ancora prodotti.
            </p>
          )}

          <div style={styles.cta}>
            <p style={styles.ctaText}>
              Vuoi creare anche tu una lista regali?
            </p>
            <a href="/create" style={styles.ctaButton}>
              Crea la tua lista
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>© 2025 PRET A BEBÈ - Tutti i diritti riservati</p>
        <a href="https://www.pretabebe.com" style={styles.footerLink}>
          Visita il nostro negozio
        </a>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#fdf8f5",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    backgroundColor: "#2c3e50",
    color: "white",
    padding: "20px",
    textAlign: "center",
  },
  logo: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "bold",
    letterSpacing: "2px",
  },
  subtitle: {
    margin: "5px 0 0",
    fontSize: "14px",
    opacity: 0.8,
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  giftIcon: {
    fontSize: "64px",
    textAlign: "center",
    marginBottom: "16px",
  },
  errorIcon: {
    fontSize: "64px",
    textAlign: "center",
    marginBottom: "16px",
  },
  title: {
    fontSize: "32px",
    color: "#2c3e50",
    marginBottom: "16px",
    textAlign: "center",
  },
  description: {
    fontSize: "16px",
    color: "#666",
    lineHeight: 1.6,
    textAlign: "center",
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "20px",
    color: "#2c3e50",
    marginBottom: "16px",
    borderBottom: "2px solid #ecf0f1",
    paddingBottom: "8px",
  },
  itemsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "32px",
  },
  itemCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    border: "2px solid #ecf0f1",
  },
  itemCardPurchased: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    backgroundColor: "#f0f9f0",
    borderRadius: "12px",
    border: "2px solid #c8e6c9",
    opacity: 0.7,
  },
  itemImage: {
    fontSize: "40px",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  },
  itemImageImg: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
  itemImageImgPurchased: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    borderRadius: "8px",
    backgroundColor: "#fff",
    opacity: 0.6,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    margin: "0 0 4px",
    fontSize: "18px",
    color: "#2c3e50",
  },
  itemPrice: {
    margin: "4px 0 0",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#e74c3c",
  },
  itemActions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  discoverButton: {
    padding: "10px 20px",
    backgroundColor: "#34495e",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  buyButton: {
    padding: "12px 24px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  purchasedBadge: {
    padding: "8px 16px",
    backgroundColor: "#4caf50",
    color: "white",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#999",
    padding: "40px",
    fontSize: "18px",
  },
  cta: {
    marginTop: "40px",
    padding: "24px",
    backgroundColor: "#fef5f4",
    borderRadius: "12px",
    textAlign: "center",
  },
  ctaText: {
    margin: "0 0 16px",
    color: "#666",
  },
  ctaButton: {
    display: "inline-block",
    padding: "12px 32px",
    backgroundColor: "#2c3e50",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    padding: "20px",
    color: "#999",
    fontSize: "14px",
  },
  footerLink: {
    color: "#e74c3c",
    textDecoration: "none",
  },
  loading: {
    textAlign: "center",
    color: "#666",
    padding: "40px",
    fontSize: "18px",
  },
};

export default ViewGiftListPage;

