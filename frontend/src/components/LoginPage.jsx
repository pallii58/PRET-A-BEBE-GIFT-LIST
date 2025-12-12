import { useState } from "react";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("password"); // 'password' o 'otp'
  const [otpSent, setOtpSent] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Inserisci email e password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Errore durante il login");
      }

      // Salva token in localStorage
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Inserisci la tua email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth?action=magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Errore durante l'invio");
      }

      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!email || !otpCode) {
      setError("Inserisci email e codice OTP");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth?action=verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Codice non valido");
      }

      // Salva token in localStorage
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.header}>
          <h1 style={styles.logo}>PRET A BEBÈ</h1>
          <p style={styles.subtitle}>Pannello Amministrazione</p>
        </div>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(mode === "password" ? styles.tabActive : {}),
            }}
            onClick={() => {
              setMode("password");
              setError(null);
              setOtpSent(false);
            }}
          >
            🔐 Password
          </button>
          <button
            style={{
              ...styles.tab,
              ...(mode === "otp" ? styles.tabActive : {}),
            }}
            onClick={() => {
              setMode("otp");
              setError(null);
            }}
          >
            📧 Codice OTP
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {mode === "password" && (
          <form onSubmit={handlePasswordLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                autoComplete="email"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>
        )}

        {mode === "otp" && !otpSent && (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                autoComplete="email"
              />
            </div>
            <p style={styles.hint}>
              Riceverai un codice di 6 cifre via email per accedere.
            </p>
            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? "Invio in corso..." : "Invia codice OTP"}
            </button>
          </form>
        )}

        {mode === "otp" && otpSent && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.successMessage}>
              ✅ Codice inviato a {email}
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Codice OTP</label>
              <input
                type="text"
                style={styles.otpInput}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? "Verifica in corso..." : "Verifica codice"}
            </button>
            <button
              type="button"
              style={styles.linkButton}
              onClick={() => setOtpSent(false)}
            >
              Invia nuovo codice
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <p>© 2025 PRET A BEBÈ - Lista Regali</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  loginCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logo: {
    margin: 0,
    fontSize: "28px",
    color: "#2c3e50",
    fontWeight: "bold",
    letterSpacing: "2px",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#666",
    fontSize: "14px",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
  },
  tab: {
    flex: 1,
    padding: "12px",
    border: "2px solid #eee",
    borderRadius: "8px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#666",
    transition: "all 0.2s",
  },
  tabActive: {
    borderColor: "#e74c3c",
    backgroundColor: "#fef5f4",
    color: "#e74c3c",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  input: {
    padding: "14px",
    border: "2px solid #eee",
    borderRadius: "8px",
    fontSize: "16px",
    transition: "border-color 0.2s",
    outline: "none",
  },
  otpInput: {
    padding: "20px",
    border: "2px solid #eee",
    borderRadius: "8px",
    fontSize: "28px",
    textAlign: "center",
    letterSpacing: "8px",
    fontWeight: "bold",
    outline: "none",
  },
  hint: {
    fontSize: "13px",
    color: "#888",
    margin: 0,
  },
  submitButton: {
    padding: "16px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "8px",
  },
  linkButton: {
    padding: "12px",
    backgroundColor: "transparent",
    color: "#666",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "underline",
  },
  error: {
    backgroundColor: "#fee",
    color: "#c00",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    textAlign: "center",
  },
  successMessage: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #eee",
    color: "#999",
    fontSize: "12px",
  },
};

export default LoginPage;

