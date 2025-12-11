import { AppProvider, Card, Button, Text } from "@shopify/polaris";
import { useState } from "react";
import ListCreator from "./components/ListCreator.jsx";
import ListDashboard from "./components/ListDashboard.jsx";
import PublicGiftPage from "./components/PublicGiftPage.jsx";

function App() {
  const [selected, setSelected] = useState("create");

  return (
    <AppProvider i18n={{}}>
      <div style={{ maxWidth: 960, margin: "20px auto", padding: "12px" }}>
        <Text as="h1" variant="headingLg">
          LISTA REGALI PRET A BEBE
        </Text>
        <div style={{ display: "flex", gap: "8px", margin: "16px 0" }}>
          <Button primary={selected === "create"} onClick={() => setSelected("create")}>
            Crea lista
          </Button>
          <Button primary={selected === "dashboard"} onClick={() => setSelected("dashboard")}>
            Dashboard
          </Button>
          <Button primary={selected === "public"} onClick={() => setSelected("public")}>
            Pagina pubblica demo
          </Button>
        </div>

        <Card>
          {selected === "create" && <ListCreator />}
          {selected === "dashboard" && <ListDashboard />}
          {selected === "public" && <PublicGiftPage />}
        </Card>
      </div>
    </AppProvider>
  );
}

export default App;

