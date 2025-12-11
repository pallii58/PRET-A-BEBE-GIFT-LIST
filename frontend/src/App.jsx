import { AppProvider, Card, Button, Text } from "@shopify/polaris";
import * as AppBridgeReact from "@shopify/app-bridge-react";
import { useMemo, useState } from "react";
import ListCreator from "./components/ListCreator.jsx";
import ListDashboard from "./components/ListDashboard.jsx";
import PublicGiftPage from "./components/PublicGiftPage.jsx";

const useQueryParam = (key) => {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
};

function EmbeddedWrapper({ children }) {
  const AppBridgeProvider = AppBridgeReact?.Provider || AppBridgeReact?.default || null;
  const host = useQueryParam("host");
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;
  const appBridgeConfig = useMemo(() => {
    const cfg =
      host && apiKey
        ? {
            apiKey,
            host,
            forceRedirect: true,
          }
        : null;
    if (typeof window !== "undefined") {
      // Debug log for embed initialization
      console.debug("AppBridge config", { host, hasApiKey: !!apiKey, cfg });
    }
    return cfg;
  }, [host, apiKey]);

  if (!appBridgeConfig || !AppBridgeProvider) {
    if (typeof window !== "undefined") {
      console.debug("Skipping AppBridgeProvider", {
        hasConfig: !!appBridgeConfig,
        hasProvider: !!AppBridgeProvider,
      });
    }
    return children;
  }

  return <AppBridgeProvider config={appBridgeConfig}>{children}</AppBridgeProvider>;
}

function App() {
  const [selected, setSelected] = useState("create");

  return (
    <AppProvider i18n={{}}>
      <EmbeddedWrapper>
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
      </EmbeddedWrapper>
    </AppProvider>
  );
}

export default App;

