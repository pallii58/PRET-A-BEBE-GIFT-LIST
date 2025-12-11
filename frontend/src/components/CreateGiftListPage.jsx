import { useState, useEffect } from "react";

const CreateGiftListPage = () => {
  const [step, setStep] = useState(1); // 1: intro, 2: selezione prodotti, 3: form dati, 4: successo
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [listName, setListName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdList, setCreatedList] = useState(null);
  const [copied, setCopied] = useState(false);

  // Carica i prodotti (per ora mock, poi integreremo Shopify)
  useEffect(() => {
    if (step === 2) {
      loadProducts();
    }
  }, [step]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // TODO: Integrare con Shopify Storefront API
      // Per ora usiamo prodotti di esempio
      const mockProducts = [
        { id: "prod_1", variant_id: "var_1", title: "Passeggino Anex air z", price: "305.00", image: "https://via.placeholder.com/150" },
        { id: "prod_2", variant_id: "var_2", title: "Seggiolone Ozy", price: "299.00", image: "https://via.placeholder.com/150" },
        { id: "prod_3", variant_id: "var_3", title: "Culla Mini Stokke", price: "815.00", image: "https://via.placeholder.com/150" },
        { id: "prod_4", variant_id: "var_4", title: "Balance Bike Banwood", price: "155.00", image: "https://via.placeholder.com/150" },
        { id: "prod_5", variant_id: "var_5", title: "Tripp Trapp Sedia", price: "229.00", image: "https://via.placeholder.com/150" },
        { id: "prod_6", variant_id: "var_6", title: "Activity Table Forest", price: "95.00", image: "https://via.placeholder.com/150" },
      ];
      setProducts(mockProducts);
    } catch (err) {
      setError("Errore nel caricamento dei prodotti");
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const createList = async () => {
    if (!listName || !email) {
      setError("Inserisci nome lista e email");
      return;
    }
    if (selectedProducts.length === 0) {
      setError("Seleziona almeno un prodotto");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crea la lista
      const listRes = await fetch("/api/gift_lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: listName, customer_email: email }),
      });
      const listData = await listRes.json();
      if (!listRes.ok) throw new Error(listData.message || "Errore nella creazione");

      // Aggiungi i prodotti alla lista
      for (const product of selectedProducts) {
        await fetch(`/api/gift_lists/${listData.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: product.id,
            variant_id: product.variant_id,
            quantity: 1,
          }),
        });
      }

      setCreatedList(listData);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = () => {
    if (!createdList) return "";
    return `https://pret-a-bebe-gift-list.vercel.app/gift/${createdList.public_url}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `🎁 Ecco la mia Lista Regali "${listName}"!\n\nAiutami a scegliere i regali per il mio bambino:\n${getPublicUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>PRET A BEBÈ</h1>
        <p style={styles.subtitle}>Lista Regali</p>
      </div>

      {/* Step 1: Introduzione */}
      {step === 1 && (
        <div style={styles.content}>
          <div style={styles.card}>
            <h2 style={styles.title}>🎁 Crea la tua Lista Regali</h2>
            <p style={styles.description}>
              Stai aspettando un bebè? Crea la tua lista dei desideri e condividila 
              con amici e parenti. Loro potranno vedere cosa ti serve e regalarti 
              esattamente quello che desideri!
            </p>
            <ul style={styles.benefits}>
              <li>✨ Scegli i prodotti che ami dal nostro catalogo</li>
              <li>📧 Ricevi aggiornamenti via email sugli acquisti</li>
              <li>🔗 Condividi il link con chi vuoi</li>
              <li>🎉 Evita regali doppi!</li>
            </ul>
            <button style={styles.primaryButton} onClick={() => setStep(2)}>
              Inizia a creare la tua lista
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Selezione prodotti */}
      {step === 2 && (
        <div style={styles.content}>
          <div style={styles.card}>
            <h2 style={styles.title}>Seleziona i prodotti</h2>
            <p style={styles.description}>
              Scegli i prodotti che vorresti ricevere in regalo. 
              Selezionati: <strong>{selectedProducts.length}</strong>
            </p>

            {loading ? (
              <p style={styles.loading}>Caricamento prodotti...</p>
            ) : (
              <div style={styles.productsGrid}>
                {products.map((product) => {
                  const isSelected = selectedProducts.find((p) => p.id === product.id);
                  return (
                    <div
                      key={product.id}
                      style={{
                        ...styles.productCard,
                        ...(isSelected ? styles.productCardSelected : {}),
                      }}
                      onClick={() => toggleProduct(product)}
                    >
                      <img src={product.image} alt={product.title} style={styles.productImage} />
                      <h4 style={styles.productTitle}>{product.title}</h4>
                      <p style={styles.productPrice}>€{product.price}</p>
                      {isSelected && <span style={styles.checkmark}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.buttonRow}>
              <button style={styles.secondaryButton} onClick={() => setStep(1)}>
                Indietro
              </button>
              <button
                style={styles.primaryButton}
                onClick={() => setStep(3)}
                disabled={selectedProducts.length === 0}
              >
                Continua ({selectedProducts.length} prodotti)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Form dati */}
      {step === 3 && (
        <div style={styles.content}>
          <div style={styles.card}>
            <h2 style={styles.title}>Completa la tua lista</h2>
            <p style={styles.description}>
              Dai un nome alla tua lista e inserisci la tua email per ricevere 
              aggiornamenti quando qualcuno acquista un regalo.
            </p>

            <div style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nome della lista</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="es. Lista nascita di Sofia"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>La tua email</label>
                <input
                  type="email"
                  style={styles.input}
                  placeholder="es. sofia@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.summary}>
              <h4>Riepilogo prodotti selezionati:</h4>
              {selectedProducts.map((p) => (
                <p key={p.id} style={styles.summaryItem}>• {p.title}</p>
              ))}
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.buttonRow}>
              <button style={styles.secondaryButton} onClick={() => setStep(2)}>
                Indietro
              </button>
              <button
                style={styles.primaryButton}
                onClick={createList}
                disabled={loading}
              >
                {loading ? "Creazione..." : "Crea la mia lista"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Successo */}
      {step === 4 && createdList && (
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.successIcon}>🎉</div>
            <h2 style={styles.title}>Lista creata con successo!</h2>
            <p style={styles.description}>
              La tua lista "<strong>{listName}</strong>" è pronta. 
              Condividi il link con amici e parenti!
            </p>

            <div style={styles.linkBox}>
              <input
                type="text"
                style={styles.linkInput}
                value={getPublicUrl()}
                readOnly
              />
              <button style={styles.copyButton} onClick={copyLink}>
                {copied ? "Copiato!" : "Copia"}
              </button>
            </div>

            <div style={styles.shareButtons}>
              <button style={styles.whatsappButton} onClick={shareOnWhatsApp}>
                📱 Condividi su WhatsApp
              </button>
            </div>

            <button
              style={styles.secondaryButton}
              onClick={() => window.open(getPublicUrl(), "_blank")}
            >
              Visualizza la tua lista
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p>© 2025 PRET A BEBÈ - Tutti i diritti riservati</p>
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
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: "28px",
    color: "#2c3e50",
    marginBottom: "16px",
    textAlign: "center",
  },
  description: {
    fontSize: "16px",
    color: "#666",
    lineHeight: 1.6,
    textAlign: "center",
    marginBottom: "24px",
  },
  benefits: {
    listStyle: "none",
    padding: 0,
    margin: "24px 0",
  },
  primaryButton: {
    display: "block",
    width: "100%",
    padding: "16px 32px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  secondaryButton: {
    padding: "12px 24px",
    backgroundColor: "#ecf0f1",
    color: "#2c3e50",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  buttonRow: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    marginTop: "24px",
  },
  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  productCard: {
    position: "relative",
    padding: "16px",
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    textAlign: "center",
    cursor: "pointer",
    border: "2px solid transparent",
    transition: "all 0.3s",
  },
  productCardSelected: {
    borderColor: "#e74c3c",
    backgroundColor: "#fef5f4",
  },
  productImage: {
    width: "100%",
    height: "100px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  productTitle: {
    fontSize: "14px",
    margin: "8px 0 4px",
    color: "#2c3e50",
  },
  productPrice: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#e74c3c",
    margin: 0,
  },
  checkmark: {
    position: "absolute",
    top: "8px",
    right: "8px",
    backgroundColor: "#e74c3c",
    color: "white",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  },
  form: {
    marginBottom: "24px",
  },
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#2c3e50",
  },
  input: {
    width: "100%",
    padding: "14px",
    border: "2px solid #ecf0f1",
    borderRadius: "8px",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  summary: {
    backgroundColor: "#f9f9f9",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  summaryItem: {
    margin: "4px 0",
    color: "#666",
  },
  successIcon: {
    fontSize: "64px",
    textAlign: "center",
    marginBottom: "16px",
  },
  linkBox: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
  },
  linkInput: {
    flex: 1,
    padding: "14px",
    border: "2px solid #ecf0f1",
    borderRadius: "8px",
    fontSize: "14px",
  },
  copyButton: {
    padding: "14px 24px",
    backgroundColor: "#2c3e50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  shareButtons: {
    marginBottom: "24px",
  },
  whatsappButton: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#25D366",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: "16px",
  },
  loading: {
    textAlign: "center",
    color: "#666",
    padding: "40px",
  },
  footer: {
    textAlign: "center",
    padding: "20px",
    color: "#999",
    fontSize: "14px",
  },
};

export default CreateGiftListPage;

