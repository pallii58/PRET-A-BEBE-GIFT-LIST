import knex from "knex";
import config from "./knexfile.js";

const run = async () => {
  const db = knex(config);
  try {
    await db.migrate.latest();
    console.log("Migrations completed");
  } catch (err) {
    console.error("Migration failed", err);
    process.exit(1);
  } finally {
    await db.destroy();
  }
};

run();

