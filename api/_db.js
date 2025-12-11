import knex from "knex";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirMigrations = path.join(__dirname, "../backend/db/migrations");
// Use POSTGRES_URL from Supabase-Vercel integration, fallback to building from individual vars or DATABASE_URL
let url = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!url && process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD) {
  const host = process.env.POSTGRES_HOST;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DATABASE || "postgres";
  const port = process.env.POSTGRES_PORT || "5432";
  url = `postgresql://${user}:${password}@${host}:${port}/${database}`;
}
const isPostgres = url && (url.startsWith("postgres://") || url.startsWith("postgresql://"));

const config = isPostgres
  ? {
      client: "pg",
      connection: {
        connectionString: url,
        ssl: url.includes("supabase") 
          ? { rejectUnauthorized: false }
          : false,
      },
      pool: { min: 0, max: 10 },
      migrations: { directory: dirMigrations },
    }
  : {
      client: "sqlite3",
      connection: {
        filename: url || path.join(__dirname, "../gift_registry.sqlite"),
      },
      useNullAsDefault: true,
      migrations: { directory: dirMigrations },
    };

const db = knex(config);

export default db;

