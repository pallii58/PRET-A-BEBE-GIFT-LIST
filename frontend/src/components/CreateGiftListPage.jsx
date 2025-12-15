import { useState, useEffect } from "react";

const CreateGiftListPage = ({ embedded = false, onListCreated }) => {
  const [step, setStep] = useState(embedded ? 2 : 1); // 1: intro, 2: selezione prodotti, 3: form dati, 4: successo
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [listName, setListName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdList, setCreatedList] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editListId, setEditListId] = useState(null);
  const [existingItems, setExistingItems] = useState([]);
  
  // Filtri e paginazione
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, hasPreviousPage: false });
  const [cursors, setCursors] = useState([]); // Stack di cursori per navigazione indietro
  const [currentCursor, setCurrentCursor] = useState(null);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Controlla se siamo in modalità modifica (querystring ?edit=ID)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const edit = params.get("edit");
      if (edit) {
        setEditMode(true);
        setEditListId(edit);
        setStep(2);
        loadExistingList(edit);
      }
    } catch (err) {
      console.error("Error reading edit param", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carica collezioni e prodotti
  useEffect(() => {
    if (step === 2) {
      loadCollections();
      loadProducts();
    }
  }, [step]);

  // Ricarica prodotti quando cambiano i filtri
  useEffect(() => {
    if (step === 2) {
      setCurrentCursor(null);
      setCursors([]);
      loadProducts();
    }
  }, [searchQuery, selectedCollection]);

  const loadCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await fetch("/api/collections");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCollections(data);
      }
    } catch (err) {
      console.error("[Frontend] Error loading collections:", err);
    } finally {
      setLoadingCollections(false);
    }
  };

  const loadExistingList = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gift_lists/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Errore nel caricamento della lista");

      setListName(data.title || "");
      setEmail(data.customer_email || "");

      const items = data.items || [];
      setExistingItems(items);

      // Pre-seleziona i prodotti partendo dagli items esistenti
      const preselected = items.map((item) => ({
        id: item.product_id,
        variant_id: item.variant_id,
        title: item.product_title,
        image: item.product_image,
        price: item.product_price,
        handle: item.product_handle,
      }));
      setSelectedProducts(preselected);
    } catch (err) {
      console.error("Error loading existing list:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (cursor = null) => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/products?limit=100";
      if (cursor) url += `&cursor=${cursor}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedCollection) url += `&collection=${encodeURIComponent(selectedCollection)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Errore nel caricamento");
      
      setProducts(data.products || []);
      setPageInfo(data.pageInfo || { hasNextPage: false, hasPreviousPage: false });
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Errore nel caricamento dei prodotti");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pageInfo.hasNextPage && pageInfo.endCursor) {
      setCursors([...cursors, currentCursor]);
      setCurrentCursor(pageInfo.endCursor);
      loadProducts(pageInfo.endCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursors.length > 0) {
      const newCursors = [...cursors];
      const prevCursor = newCursors.pop();
      setCursors(newCursors);
      setCurrentCursor(prevCursor);
      loadProducts(prevCursor);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // La ricerca viene gestita dall'useEffect
  };

  const selectCollection = (handle) => {
    setSelectedCollection(handle === selectedCollection ? null : handle);
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

  const submitList = async () => {
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
      let listData;

      if (editMode && editListId) {
        // Aggiorna lista esistente (titolo/email + slug)
        const updateRes = await fetch(`/api/gift_lists/${editListId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: listName, customer_email: email }),
        });
        listData = await updateRes.json();
        if (!updateRes.ok) throw new Error(listData.message || "Errore nell'aggiornamento della lista");

        // Sostituisci completamente gli items
        const itemsPayload = selectedProducts.map((product) => {
          const existing = existingItems.find(
            (i) =>
              String(i.product_id) === String(product.id) &&
              String(i.variant_id) === String(product.variant_id)
          );

          return {
            product_id: product.id,
            variant_id: product.variant_id,
            quantity: 1,
            product_title: product.title,
            product_image: product.image,
            product_price: product.price,
            product_handle: product.handle,
            purchased: existing?.purchased || false,
          };
        });

        const itemsRes = await fetch(`/api/gift_lists/${editListId}/items`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsPayload }),
        });
        const itemsData = await itemsRes.json();
        if (!itemsRes.ok) throw new Error(itemsData.message || "Errore nell'aggiornamento dei prodotti");
      } else {
        // Crea nuova lista
        const listRes = await fetch("/api/gift_lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: listName, customer_email: email }),
        });
        listData = await listRes.json();
        if (!listRes.ok) throw new Error(listData.message || "Errore nella creazione");

        for (const product of selectedProducts) {
          await fetch(`/api/gift_lists/${listData.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: product.id,
              variant_id: product.variant_id,
              quantity: 1,
              product_title: product.title,
              product_image: product.image,
              product_price: product.price,
              product_handle: product.handle,
            }),
          });
        }
      }

      setCreatedList(listData);
      setStep(4);
      // Callback per modalità embedded
      if (onListCreated) {
        onListCreated(listData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = () => {
    if (!createdList) return "";
    return `https://giftlist.pretabebe.it/lista/${createdList.public_url}`;
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
    <div style={embedded ? styles.containerEmbedded : styles.container}>
      {/* Header - solo se non embedded */}
      {!embedded && (
        <div style={styles.header}>
          <h1 style={styles.logo}>PRET A BEBÈ</h1>
          <p style={styles.subtitle}>Lista Regali</p>
        </div>
      )}

      {/* Step 1: Introduzione - solo se non embedded */}
      {step === 1 && !embedded && (
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

      {/* Step 2: Selezione prodotti con sidebar collezioni */}
      {step === 2 && (
        <div style={styles.shopLayout}>
          {/* Sidebar Collezioni - scroll indipendente */}
          <aside style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Collezioni</h3>
            </div>
            <div style={styles.categoryListScroll}>
              {loadingCollections ? (
                <div style={styles.loaderContainer}>
                  <div style={styles.spinner}></div>
                  <p style={styles.loaderText}>Caricamento...</p>
                </div>
              ) : (
                <>
                  <button
                    style={{
                      ...styles.categoryButton,
                      ...(selectedCollection === null ? styles.categoryButtonActive : {}),
                    }}
                    onClick={() => selectCollection(null)}
                  >
                    🏠 Tutti i prodotti
                  </button>
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      style={{
                        ...styles.categoryButton,
                        ...(selectedCollection === col.handle ? styles.categoryButtonActive : {}),
                      }}
                      onClick={() => selectCollection(col.handle)}
                    >
                      {col.title}
                    </button>
                  ))}
                </>
              )}
            </div>
            
            {/* Prodotti selezionati - fisso in basso */}
            <div style={styles.selectedSummary}>
              <h4 style={styles.selectedTitle}>
                Selezionati: {selectedProducts.length}
              </h4>
              {selectedProducts.length > 0 && (
                <button
                  style={styles.continueButtonSidebar}
                  onClick={() => setStep(3)}
                >
                  Continua →
                </button>
              )}
            </div>
          </aside>

          {/* Area principale prodotti - scroll indipendente */}
          <main style={styles.mainContent}>
            {/* Barra di ricerca e filtri */}
            <div style={styles.searchBar}>
              <form onSubmit={handleSearch} style={styles.searchForm}>
                <input
                  type="text"
                  placeholder="Cerca prodotti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
                <button type="submit" style={styles.searchButton}>
                  🔍
                </button>
              </form>
              {selectedProducts.length > 0 && (
                <div style={styles.selectedBadge}>
                  {selectedProducts.length} selezionati
                </div>
              )}
            </div>

            {/* Titolo sezione */}
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                {selectedCollection 
                  ? collections.find(c => c.handle === selectedCollection)?.title || "Prodotti"
                  : "Tutti i prodotti"}
              </h2>
              <p style={styles.productCount}>
                {products.length} prodotti mostrati
              </p>
            </div>

            {/* Area scroll prodotti */}
            <div style={styles.productsScrollArea}>
              {/* Griglia prodotti */}
              {loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinnerLarge}></div>
                  <p style={styles.loaderText}>Caricamento prodotti...</p>
                </div>
              ) : error ? (
                <div style={styles.errorContainer}>
                  <p style={styles.error}>{error}</p>
                  <button style={styles.retryButton} onClick={() => loadProducts()}>
                    Riprova
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <p>Nessun prodotto trovato</p>
                </div>
              ) : (
                <>
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
                        >
                          <div onClick={() => toggleProduct(product)} style={styles.productClickArea}>
                            {product.image ? (
                              <img src={product.image} alt={product.title} style={styles.productImage} />
                            ) : (
                              <div style={styles.productImagePlaceholder}>📦</div>
                            )}
                            <h4 style={styles.productTitle}>{product.title}</h4>
                            <p style={styles.productPrice}>€{parseFloat(product.price).toFixed(2)}</p>
                            {isSelected && <span style={styles.checkmark}>✓</span>}
                          </div>
                          <button
                            style={styles.discoverButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.pretabebe.com/products/${product.handle}`, '_blank');
                            }}
                          >
                            Scopri di più
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Paginazione - solo se più di una pagina */}
                  {(pageInfo.hasNextPage || cursors.length > 0) && (
                    <div style={styles.pagination}>
                      <button
                        style={{
                          ...styles.pageButton,
                          ...(cursors.length === 0 ? styles.pageButtonDisabled : {}),
                        }}
                        onClick={handlePrevPage}
                        disabled={cursors.length === 0}
                      >
                        ← Precedente
                      </button>
                      <span style={styles.pageInfo}>
                        Pagina {cursors.length + 1}
                      </span>
                      <button
                        style={{
                          ...styles.pageButton,
                          ...(!pageInfo.hasNextPage ? styles.pageButtonDisabled : {}),
                        }}
                        onClick={handleNextPage}
                        disabled={!pageInfo.hasNextPage}
                      >
                        Successiva →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pulsanti navigazione - fissi in basso */}
            <div style={styles.bottomBar}>
              <button style={styles.secondaryButton} onClick={() => setStep(1)}>
                ← Indietro
              </button>
              <button
                style={{
                  ...styles.primaryButton,
                  ...(selectedProducts.length === 0 ? styles.buttonDisabled : {}),
                }}
                onClick={() => setStep(3)}
                disabled={selectedProducts.length === 0}
              >
                Continua con {selectedProducts.length} prodotti →
              </button>
            </div>
          </main>
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
              <h4 style={styles.summaryTitle}>Riepilogo prodotti selezionati ({selectedProducts.length}):</h4>
              <div style={styles.summaryGrid}>
                {selectedProducts.map((p) => (
                  <div key={p.id} style={styles.summaryItem}>
                    {p.image && <img src={p.image} alt="" style={styles.summaryImage} />}
                    <span>{p.title}</span>
                    <button
                      style={styles.removeButton}
                      onClick={() => toggleProduct(p)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.buttonRow}>
              <button style={styles.secondaryButton} onClick={() => setStep(2)}>
                ← Modifica selezione
              </button>
              <button
                style={styles.primaryButton}
                onClick={submitList}
                disabled={loading}
              >
                {loading
                  ? editMode
                    ? "Salvataggio..."
                    : "Creazione..."
                  : editMode
                    ? "Salva modifiche alla lista"
                    : "Crea la mia lista 🎁"}
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
                {copied ? "✓ Copiato!" : "Copia"}
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
              👁 Visualizza la tua lista
            </button>
          </div>
        </div>
      )}

      {/* Footer - solo se non embedded */}
      {!embedded && (
        <div style={styles.footer}>
          <p>© 2025 PRET A BEBÈ - Tutti i diritti riservati</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#fdf8f5",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  containerEmbedded: {
    backgroundColor: "#fdf8f5",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    minHeight: "600px",
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
  
  // Layout Shop con sidebar - altezza 100vh
  shopLayout: {
    display: "flex",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "20px",
    gap: "24px",
    height: "calc(100vh - 100px)", // Altezza meno header
    overflow: "hidden",
  },
  sidebar: {
    width: "280px",
    flexShrink: 0,
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  sidebarHeader: {
    padding: "20px 20px 0",
  },
  sidebarTitle: {
    margin: "0 0 16px",
    fontSize: "18px",
    color: "#2c3e50",
    borderBottom: "2px solid #e74c3c",
    paddingBottom: "8px",
  },
  categoryListScroll: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "0 20px",
    overflowY: "auto",
    flex: 1,
  },
  categoryButton: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "15px 12px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
    color: "#666",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  categoryButtonActive: {
    backgroundColor: "#fef5f4",
    color: "#e74c3c",
    fontWeight: "bold",
  },
  selectedSummary: {
    padding: "16px 20px",
    backgroundColor: "#fef5f4",
    borderTop: "1px solid #eee",
    flexShrink: 0,
  },
  selectedTitle: {
    margin: "0 0 12px",
    fontSize: "16px",
    color: "#e74c3c",
  },
  continueButtonSidebar: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  // Main content - scroll indipendente
  mainContent: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  productsScrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "0 4px",
  },
  searchBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "16px",
  },
  searchForm: {
    display: "flex",
    flex: 1,
    maxWidth: "400px",
  },
  searchInput: {
    flex: 1,
    padding: "12px 16px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px 0 0 8px",
    fontSize: "14px",
    outline: "none",
  },
  searchButton: {
    padding: "12px 20px",
    backgroundColor: "#2c3e50",
    color: "white",
    border: "none",
    borderRadius: "0 8px 8px 0",
    cursor: "pointer",
    fontSize: "16px",
  },
  selectedBadge: {
    padding: "8px 16px",
    backgroundColor: "#e74c3c",
    color: "white",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#2c3e50",
  },
  productCount: {
    margin: 0,
    color: "#999",
    fontSize: "14px",
  },

  // Products grid
  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  productCard: {
    position: "relative",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "12px",
    textAlign: "center",
    border: "2px solid #f0f0f0",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
  },
  productClickArea: {
    cursor: "pointer",
    flex: 1,
  },
  productCardSelected: {
    borderColor: "#e74c3c",
    backgroundColor: "#fef5f4",
    boxShadow: "0 4px 12px rgba(231,76,60,0.2)",
  },
  productImage: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  productImagePlaceholder: {
    width: "100%",
    height: "140px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
  },
  productTitle: {
    fontSize: "14px",
    margin: "12px 0 6px",
    color: "#2c3e50",
    lineHeight: 1.3,
    height: "36px",
    overflow: "hidden",
  },
  productPrice: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#e74c3c",
    margin: 0,
  },
  checkmark: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#e74c3c",
    color: "white",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
  },
  discoverButton: {
    marginTop: "10px",
    padding: "8px 12px",
    backgroundColor: "#2c3e50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },

  // Pagination
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },
  pageButton: {
    padding: "10px 20px",
    backgroundColor: "#2c3e50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  pageButtonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  pageInfo: {
    color: "#666",
    fontSize: "14px",
  },

  // Buttons
  primaryButton: {
    padding: "16px 32px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  secondaryButton: {
    padding: "14px 24px",
    backgroundColor: "#ecf0f1",
    color: "#2c3e50",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  buttonRow: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    marginTop: "24px",
  },
  bottomBar: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    padding: "16px 0",
    backgroundColor: "white",
    borderTop: "1px solid #eee",
    flexShrink: 0,
  },

  // Form
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

  // Summary
  summary: {
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  summaryTitle: {
    margin: "0 0 20px 0",
  },
  summaryGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    backgroundColor: "white",
    borderRadius: "8px",
  },
  summaryImage: {
    width: "40px",
    height: "40px",
    borderRadius: "4px",
    objectFit: "cover",
  },
  removeButton: {
    marginLeft: "auto",
    padding: "4px 8px",
    backgroundColor: "#ff6b6b",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },

  // Success
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
    fontWeight: "bold",
  },
  shareButtons: {
    marginBottom: "24px",
  },
  whatsappButton: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#25D366",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  // States
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
  },
  errorContainer: {
    textAlign: "center",
    padding: "40px",
  },
  error: {
    color: "#e74c3c",
    marginBottom: "16px",
  },
  retryButton: {
    padding: "10px 20px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  emptyContainer: {
    textAlign: "center",
    padding: "60px",
    color: "#999",
  },

  footer: {
    textAlign: "center",
    padding: "20px",
    color: "#999",
    fontSize: "14px",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f0f0f0",
    borderTop: "4px solid #e74c3c",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerLarge: {
    width: "60px",
    height: "60px",
    border: "5px solid #f0f0f0",
    borderTop: "5px solid #e74c3c",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loaderText: {
    marginTop: "12px",
    color: "#999",
    fontSize: "14px",
  },
}

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  if (!document.querySelector('style[data-spinner]')) {
    style.setAttribute('data-spinner', 'true');
    document.head.appendChild(style);
  }
}

export default CreateGiftListPage;
