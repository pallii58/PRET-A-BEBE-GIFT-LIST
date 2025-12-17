import { useState, useEffect } from "react";

const ViewGiftListPage = ({ publicUrl }) => {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gifterName, setGifterName] = useState("");
  const [gifterError, setGifterError] = useState(null);

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
    if (!gifterName.trim()) {
      setGifterError("Inserisci il tuo nome prima di procedere all'acquisto");
      return;
    }
    setGifterError(null);

    // Apri il prodotto su pretabebe.com con il variant nel carrello
    const listName = encodeURIComponent(list.title);
    const fromName = encodeURIComponent(gifterName.trim());
    const shopUrl = `https://www.pretabebe.com/cart/add?id=${item.variant_id}&quantity=${item.quantity}&properties[Lista Regalo]=${listName}&properties[Da]=${fromName}`;
    window.open(shopUrl, "_blank");
  };

  const openProduct = (item) => {
    // Apri la pagina prodotto
    const url = `https://www.pretabebe.com/products/${item.product_handle}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img
            src="https://www.pretabebe.com/cdn/shop/files/logo-pretabebe_310x.png?v=1669818359"
            alt="PRET A BEBÈ"
            style={styles.logoImg}
          />
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
          <img
            src="https://www.pretabebe.com/cdn/shop/files/logo-pretabebe_310x.png?v=1669818359"
            alt="PRET A BEBÈ"
            style={styles.logoImg}
          />
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
        <img
          src="https://www.pretabebe.com/cdn/shop/files/logo-pretabebe_310x.png?v=1669818359"
          alt="PRET A BEBÈ"
          style={styles.logoImg}
        />
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.giftIcon}>🎁</div>
          <h2 style={styles.title}>{list?.title}</h2>
          <p style={styles.description}>
            Ecco la lista dei desideri! Scegli un regalo da acquistare 
            e renderai felice qualcuno di speciale.
          </p>

          {/* Disclaimer ritiro in negozio */}
          <div
            style={{
              marginBottom: "24px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffe58f",
            }}
          >
            <p style={{ margin: 0, color: "#8a6d3b", fontSize: "14px", lineHeight: 1.5 }}>
              Gli acquisti effettuati da questa lista sono esclusivamente per{" "}
              <strong>ritiro in negozio</strong>.
              <br />
              I prodotti <strong>non vengono spediti a casa</strong>.
            </p>
          </div>

          {/* Campo nome di chi regala */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#2c3e50" }}>
              Il tuo nome (verrà indicato sull'ordine)
            </label>
            <input
              type="text"
              value={gifterName}
              onChange={(e) => setGifterName(e.target.value)}
              placeholder="es. Zia Anna"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "2px solid #ecf0f1",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
            {gifterError && (
              <p style={{ marginTop: "8px", color: "#e74c3c", fontSize: "14px" }}>
                {gifterError}
              </p>
            )}
          </div>

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
      <footer style={styles.footer}>
        <div style={styles.footerTop}>
          <div style={styles.footerCol}>
            <h6 style={styles.footerTitle}>Chi siamo</h6>
            <p style={styles.footerText}>
              <strong>Fabio</strong> e <strong>Laura</strong>, marito e moglie, amici e soci ma soprattutto
              giovani genitori della piccola <strong>Bianca</strong>.
            </p>
            <p style={styles.footerText}>
              Dal 2018, proprio con l’arrivo di Bibi nasce l’idea di creare una <strong>boutique</strong>{' '}
              dedicata al mondo prima infanzia che fosse completa e con prodotti ricercati, con particolare
              attenzione alle esigenze dei nuovi genitori.
            </p>
            <p style={styles.footerText}>pi. 12225930010</p>
          </div>
          <div style={{ ...styles.footerCol, ...styles.footerColRight }}>
            <h6 style={styles.footerTitle}>INFO LEGALI</h6>
            <ul style={styles.footerMenu}>
              <li>
                <a href="https://www.pretabebe.com/policies/privacy-policy" style={styles.footerLink}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://www.pretabebe.com/policies/refund-policy" style={styles.footerLink}>
                  Politica di rimborso
                </a>
              </li>
              <li>
                <a href="https://www.pretabebe.com/policies/terms-of-service" style={styles.footerLink}>
                  Termini e condizioni
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <div style={styles.footerCopy}>
            <span>
              © 2025{' '}
              <a href="https://www.pretabebe.com" style={styles.footerLink}>
                PRET A BEBE
              </a>
              .&nbsp;All rights reserved
            </span>
          </div>
        </div>
      </footer>
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
    backgroundColor: "#f3ede4",
    color: "#2c3e50",
    padding: "16px 20px",
    textAlign: "center",
  },
  logoImg: {
    height: 20,
    objectFit: "contain",
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
    marginTop: "40px",
    backgroundColor: "#d58263",
    borderTop: "1px solid #c87457",
    fontSize: "13px",
    color: "#f3ede4",
  },
  footerTop: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "24px 20px 8px",
    display: "flex",
    gap: "32px",
    flexWrap: "wrap",
  },
  footerCol: {
    flex: 1,
    minWidth: "220px",
  },
  footerTitle: {
    margin: "0 0 8px",
    fontSize: "13px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#f3ede4",
  },
  footerText: {
    margin: "0 0 6px",
    lineHeight: 1.5,
  },
  footerMenu: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  footerLink: {
    color: "#f3ede4",
    textDecoration: "none",
  },
  footerColRight: {
    textAlign: "right",
  },
  footerBottom: {
    borderTop: "1px solid #c87457",
    padding: "12px 20px",
    textAlign: "center",
  },
  footerCopy: {
    fontSize: "12px",
    color: "#f3ede4",
  },
  loading: {
    textAlign: "center",
    color: "#666",
    padding: "40px",
    fontSize: "18px",
  },
};

export default ViewGiftListPage;

