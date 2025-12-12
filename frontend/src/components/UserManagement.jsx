import { useState, useEffect } from "react";
import { Card, Text, Button, Banner, TextField } from "@shopify/polaris";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form nuovo utente
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("collaborator");
  const [creating, setCreating] = useState(false);

  // Modal modifica
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal elimina
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPassword) {
      setError("Compila tutti i campi");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess(`Utente ${data.name} creato con successo!`);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("collaborator");
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword("");
  };

  const saveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    setError(null);

    try {
      const updateData = { name: editName, role: editRole };
      if (editPassword) updateData.password = editPassword;

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      setSuccess("Utente aggiornato con successo!");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      setSuccess("Utente eliminato con successo!");
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Mai";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      {success && (
        <Banner status="success" onDismiss={() => setSuccess(null)}>
          {success}
        </Banner>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="headingMd">Gestione Collaboratori</Text>
        <Button primary onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annulla" : "+ Nuovo collaboratore"}
        </Button>
      </div>

      {/* Form nuovo utente */}
      {showForm && (
        <Card sectioned>
          <form onSubmit={createUser}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Text variant="headingSm">Crea nuovo collaboratore</Text>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <TextField
                    label="Nome"
                    value={newName}
                    onChange={setNewName}
                    placeholder="Mario Rossi"
                  />
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={newEmail}
                    onChange={setNewEmail}
                    placeholder="mario@pretabebe.com"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <TextField
                    label="Password"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Minimo 8 caratteri"
                  />
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                    Ruolo
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="collaborator">Collaboratore</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button primary submit loading={creating}>
                  Crea collaboratore
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Lista utenti */}
      {loading ? (
        <Text tone="subdued">Caricamento...</Text>
      ) : users.length === 0 ? (
        <Text tone="subdued">Nessun collaboratore trovato.</Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
                border: "1px solid #eee",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: user.role === "admin" ? "#e74c3c" : "#3498db",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                {user.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <Text variant="headingSm">{user.name}</Text>
                <Text tone="subdued">{user.email}</Text>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: user.role === "admin" ? "#fef5f4" : "#e8f4fd",
                      color: user.role === "admin" ? "#e74c3c" : "#3498db",
                      fontWeight: "600",
                    }}
                  >
                    {user.role === "admin" ? "👑 Admin" : "👤 Collaboratore"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#999" }}>
                    Ultimo accesso: {formatDate(user.last_login)}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button onClick={() => openEditModal(user)}>✏️ Modifica</Button>
                <Button destructive onClick={() => setDeletingUser(user)}>
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Modifica */}
      {editingUser && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <Text variant="headingLg">Modifica {editingUser.name}</Text>
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <TextField label="Nome" value={editName} onChange={setEditName} />
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                  Ruolo
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="collaborator">Collaboratore</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>
              <TextField
                label="Nuova password (lascia vuoto per non modificare)"
                type="password"
                value={editPassword}
                onChange={setEditPassword}
                placeholder="Minimo 8 caratteri"
              />
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Button onClick={() => setEditingUser(null)}>Annulla</Button>
              <Button primary onClick={saveUser} loading={saving}>
                Salva modifiche
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Elimina */}
      {deletingUser && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <Text variant="headingLg">Conferma eliminazione</Text>
            <div style={{ marginTop: "16px" }}>
              <Text>
                Sei sicuro di voler eliminare l'utente <strong>{deletingUser.name}</strong> ({deletingUser.email})?
              </Text>
              <Text tone="subdued">Questa azione è irreversibile.</Text>
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Button onClick={() => setDeletingUser(null)}>Annulla</Button>
              <Button destructive onClick={deleteUser} loading={deleting}>
                Elimina utente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
};

export default UserManagement;

