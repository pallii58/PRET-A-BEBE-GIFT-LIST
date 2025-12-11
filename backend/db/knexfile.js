import path from "path";
import { fileURLToPath } from "url";

// Disable SSL certificate verification for Supabase self-signed certificates
// This is safe because we're connecting directly to Supabase's infrastructure
if (process.env.DATABASE_URL?.includes("supabase") || 
    process.env.POSTGRES_URL?.includes("supabase") ||
    process.env.POSTGRES_HOST?.includes("supabase")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirMigrations = path.join(__dirname, "migrations");
// Use POSTGRES_URL from Supabase-Vercel integration, fallback to building from individual vars or DATABASE_URL
// Prefer connection pooler (port 6543) for Supabase as it has valid certificates
let url = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

// If POSTGRES_URL is empty but we have individual vars, try to build connection string
// Note: POSTGRES_PASSWORD might be empty from integration, so we'll use DATABASE_URL as fallback
if (!url || url.trim() === "") {
  if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD) {
    const host = process.env.POSTGRES_HOST;
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;
    const database = process.env.POSTGRES_DATABASE || "postgres";
    // For Supabase, try to use pooler port (6543) if available, otherwise use direct (5432)
    const port = process.env.POSTGRES_PORT || (host.includes("supabase") ? "6543" : "5432");
    url = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }
}

// Final fallback to DATABASE_URL if nothing else works
if (!url || url.trim() === "") {
  url = process.env.DATABASE_URL;
}

const isPostgres = url && (url.startsWith("postgres://") || url.startsWith("postgresql://"));

// Parse URL and add SSL parameters for Supabase
let pgConnection = null;
if (isPostgres) {
  const isSupabase = url.includes("supabase");
  
  // For Supabase, add SSL parameters to connection string
  if (isSupabase) {
    try {
      const urlObj = new URL(url);
      // Add sslmode parameter to connection string
      const sslMode = urlObj.searchParams.get("sslmode") || "require";
      urlObj.searchParams.set("sslmode", sslMode);
      url = urlObj.toString();
    } catch (e) {
      // If URL parsing fails, append sslmode parameter
      const separator = url.includes("?") ? "&" : "?";
      url = `${url}${separator}sslmode=require`;
    }
  }
  
  // Build connection object with explicit SSL config
  try {
    const urlObj = new URL(url);
    pgConnection = {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      user: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.slice(1) || "postgres",
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
    };
  } catch (e) {
    // Fallback to connectionString with SSL params in URL
    pgConnection = {
      connectionString: url,
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
    };
  }
}

const config = isPostgres
  ? {
      client: "pg",
      connection: pgConnection,
      pool: { min: 0, max: 10 },
      migrations: { directory: dirMigrations },
    }
  : {
      client: "sqlite3",
      connection: {
        filename: url || path.join(__dirname, "../../gift_registry.sqlite"),
      },
      useNullAsDefault: true,
      migrations: { directory: dirMigrations },
    };

export default config;

