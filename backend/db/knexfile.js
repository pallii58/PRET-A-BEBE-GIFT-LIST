import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirMigrations = path.join(__dirname, "migrations");
const url = process.env.DATABASE_URL;
const isPostgres = url && (url.startsWith("postgres://") || url.startsWith("postgresql://"));

const config = isPostgres
  ? {
      client: "pg",
      connection: {
        connectionString: url,
        ssl: { rejectUnauthorized: false },
      },
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

