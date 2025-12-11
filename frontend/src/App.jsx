import { AppProvider, Page, Card, Tabs } from "@shopify/polaris";
import { useState } from "react";
import ListCreator from "./components/ListCreator.jsx";
import ListDashboard from "./components/ListDashboard.jsx";
import PublicGiftPage from "./components/PublicGiftPage.jsx";

function App() {
  const [selected, setSelected] = useState(0);
  const tabs = [
    { id: "create", content: "Crea lista", panelID: "create-panel" },
    { id: "dashboard", content: "Dashboard", panelID: "dashboard-panel" },
    { id: "public", content: "Pagina pubblica demo", panelID: "public-panel" },
  ];

  return (
    <AppProvider i18n={{}}>
      <Page title="LISTA REGALI PRET A BEBE">
        <Card>
          <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
            {selected === 0 && <ListCreator />}
            {selected === 1 && <ListDashboard />}
            {selected === 2 && <PublicGiftPage />}
          </Tabs>
        </Card>
      </Page>
    </AppProvider>
  );
}

export default App;

