import { AppProvider, Card, Button, Text } from "@shopify/polaris";
import { useState } from "react";
import ListCreator from "./components/ListCreator.jsx";
import ListDashboard from "./components/ListDashboard.jsx";
import PublicGiftPage from "./components/PublicGiftPage.jsx";

function App() {
  const [selected, setSelected] = useState("create");

  const menu = [
    { id: "create", label: "Crea lista" },
    { id: "dashboard", label: "Dashboard" },
    { id: "public", label: "Pagina pubblica" },
  ];

  return (
    <AppProvider i18n={{}}>
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: "12px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Text as="h1" variant="headingLg">
            LISTA REGALI PRET A BEBE
          </Text>
          <Text tone="subdued">Gestione liste regalo e pagine pubbliche</Text>
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
              Menu
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
            {selected === "create" && (
              <Card title="Crea nuova lista" sectioned>
                <ListCreator />
              </Card>
            )}
            {selected === "dashboard" && (
              <Card title="Dashboard liste" sectioned>
                <ListDashboard />
              </Card>
            )}
            {selected === "public" && (
              <Card title="Pagina pubblica (demo)" sectioned>
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

