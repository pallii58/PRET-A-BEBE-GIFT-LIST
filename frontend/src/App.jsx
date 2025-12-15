import { AppProvider, Card, Button, Text } from "@shopify/polaris";
import { useState, useEffect } from "react";
import ListDashboard from "./components/ListDashboard.jsx";
import CreateGiftListPage from "./components/CreateGiftListPage.jsx";
import ViewGiftListPage from "./components/ViewGiftListPage.jsx";
import LoginPage from "./components/LoginPage.jsx";
import UserManagement from "./components/UserManagement.jsx";
import AdminListDetailPage from "./components/AdminListDetailPage.jsx";

function App() {
  const [selected, setSelected] = useState("dashboard");
  const [route, setRoute] = useState({ page: "loading", params: {} });
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Parse URL to determine which page to show
    const path = window.location.pathname;
    
    if (path === "/create" || path === "/create/") {
      setRoute({ page: "create", params: {} });
      setCheckingAuth(false);
      return;
    }

    if (path.startsWith("/lista/") || path.startsWith("/gift/")) {
      const publicUrl = path.replace(/^\/(lista|gift)\//, "").replace("/", "");
      setRoute({ page: "view", params: { publicUrl } });
      setCheckingAuth(false);
      return;
    }

    // Admin area (embedded in Shopify)
    if (path.startsWith("/admin/list/")) {
      const id = path.replace("/admin/list/", "").replace("/", "");
      setRoute({ page: "admin_list_detail", params: { id } });
    } else {
      setRoute({ page: "admin", params: {} });
    }

    // For admin routes, check authentication
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("adminToken");
    const savedUser = localStorage.getItem("adminUser");

    if (!token || !savedUser) {
      setCheckingAuth(false);
      return;
    }

    try {
      const res = await fetch("/api/auth?action=verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token non valido, pulisci storage
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
      }
    } catch (err) {
      console.error("Auth check error:", err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    
    try {
      await fetch("/api/auth?action=logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setUser(null);
  };

  // Pagina pubblica: Crea la tua lista
  if (route.page === "create") {
    return <CreateGiftListPage />;
  }

  // Pagina pubblica: Visualizza lista regalo
  if (route.page === "view") {
    return <ViewGiftListPage publicUrl={route.params.publicUrl} />;
  }

  // Loading state
  if (checkingAuth) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
          <p>Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  // Non autenticato - mostra login
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Admin - pagina dettaglio lista singola
  if (route.page === "admin_list_detail" && route.params.id) {
    return <AdminListDetailPage listId={route.params.id} />;
  }

  // Admin Dashboard (autenticato)
  const menu = [
    { id: "dashboard", label: "Dashboard" },
    { id: "create", label: "Crea lista" },
  ];

  // Aggiungi gestione utenti solo per admin
  if (user.role === "admin") {
    menu.push({ id: "users", label: "Collaboratori" });
  }

  return (
    <AppProvider i18n={{}}>
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: "12px" }}>
        {/* Header con info utente */}
        <div style={{ 
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <Text as="h1" variant="headingLg">
              LISTA REGALI PRET A BEBE
            </Text>
            <Text tone="subdued">Gestione liste regalo</Text>
          </div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            padding: "12px 16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px"
          }}>
            <div style={{ textAlign: "right" }}>
              <Text variant="bodyMd" fontWeight="semibold">{user.name}</Text>
              <Text tone="subdued" variant="bodySm">
                {user.role === "admin" ? "Amministratore" : "Collaboratore"}
              </Text>
            </div>
            <Button onClick={handleLogout}>Esci</Button>
          </div>
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
              <Card title="Crea nuova lista" sectioned>
                <CreateGiftListPage 
                  embedded={true} 
                  onListCreated={() => setSelected("dashboard")}
                />
              </Card>
            )}
            {selected === "users" && user.role === "admin" && (
              <Card title="Gestione Collaboratori" sectioned>
                <UserManagement />
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
