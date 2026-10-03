import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[cloudnode] DATABASE_URL is not set. Database features will be unavailable.");
}

const pool = new Pool({
  connectionString: connectionString || undefined,
  max: 10,
});

pool.on("error", (err) => {
  console.error("[cloudnode] Unexpected Postgres pool error:", err.message);
});

export const db = drizzle(pool, { schema });