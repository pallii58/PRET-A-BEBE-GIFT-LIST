import { AppProvider, Card, Button, Text } from "@shopify/polaris";
import { useState, useEffect } from "react";
import ListCreator from "./components/ListCreator.jsx";
import ListDashboard from "./components/ListDashboard.jsx";
import PublicGiftPage from "./components/PublicGiftPage.jsx";
import CreateGiftListPage from "./components/CreateGiftListPage.jsx";
import ViewGiftListPage from "./components/ViewGiftListPage.jsx";

function App() {
  const [selected, setSelected] = useState("dashboard");
  const [route, setRoute] = useState({ page: "admin", params: {} });

  useEffect(() => {
    // Parse URL to determine which page to show
    const path = window.location.pathname;
    
    if (path === "/create" || path === "/create/") {
      setRoute({ page: "create", params: {} });
    } else if (path.startsWith("/gift/")) {
      const publicUrl = path.replace("/gift/", "").replace("/", "");
      setRoute({ page: "view", params: { publicUrl } });
    } else {
      setRoute({ page: "admin", params: {} });
    }
  }, []);

  // Pagina pubblica: Crea la tua lista
  if (route.page === "create") {
    return <CreateGiftListPage />;
  }

  // Pagina pubblica: Visualizza lista regalo
  if (route.page === "view") {
    return <ViewGiftListPage publicUrl={route.params.publicUrl} />;
  }

  // Admin Dashboard
  const menu = [
    { id: "dashboard", label: "Dashboard" },
    { id: "create", label: "Crea lista (Admin)" },
    { id: "public", label: "Test pagina pubblica" },
  ];

  return (
    <AppProvider i18n={{}}>
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: "12px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Text as="h1" variant="headingLg">
            LISTA REGALI PRET A BEBE
          </Text>
          <Text tone="subdued">Gestione liste regalo</Text>
        </div>

        {/* Link alle pagine pubbliche */}
        <div style={{ 
          marginBottom: "16px", 
          padding: "12px", 
          backgroundColor: "#e8f4fd", 
          borderRadius: "8px",
          display: "flex",
          gap: "16px",
          alignItems: "center"
        }}>
          <Text>Pagine pubbliche:</Text>
          <a href="/create" target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>
            🎁 Crea la tua Lista Regali
          </a>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <nav
            style={{
              width: "220px",
              padding: "12px",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              background: "#fafafa",
            }}
          >
            <Text as="h2" variant="headingSm">
              Menu Admin
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              {menu.map((item) => (
                <Button
                  key={item.id}
                  fullWidth
                  primary={selected === item.id}
                  onClick={() => setSelected(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </nav>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            {selected === "dashboard" && (
              <Card title="Dashboard liste" sectioned>
                <ListDashboard />
              </Card>
            )}
            {selected === "create" && (
              <Card title="Crea nuova lista (Admin)" sectioned>
                <ListCreator />
              </Card>
            )}
            {selected === "public" && (
              <Card title="Test pagina pubblica" sectioned>
                <PublicGiftPage />
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
