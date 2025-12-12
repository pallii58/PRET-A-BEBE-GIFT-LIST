-- =====================================================
-- TABELLE AUTENTICAZIONE - LISTA REGALI PRET A BEBE
-- Esegui questo script nel SQL Editor di Supabase
-- =====================================================

-- Tabella utenti admin/collaboratori
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  role VARCHAR(50) DEFAULT 'collaborator' CHECK (role IN ('admin', 'collaborator')),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Tabella sessioni
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella OTP per magic link
CREATE TABLE IF NOT EXISTS admin_otp (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_otp_user ON admin_otp(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_otp_code ON admin_otp(code);

-- =====================================================
-- DOPO AVER ESEGUITO QUESTO SCRIPT:
-- 
-- 1. Vai su: https://pret-a-bebe-gift-list.vercel.app/
-- 2. Usa questo comando curl per creare il primo admin:
--
-- curl -X POST https://pret-a-bebe-gift-list.vercel.app/api/auth/setup \
--   -H "Content-Type: application/json" \
--   -d '{
--     "email": "TUA_EMAIL@esempio.com",
--     "name": "Il Tuo Nome",
--     "password": "la_tua_password_sicura",
--     "setupKey": "pret-a-bebe-setup-2025"
--   }'
--
-- 3. Poi accedi con email e password!
-- =====================================================

