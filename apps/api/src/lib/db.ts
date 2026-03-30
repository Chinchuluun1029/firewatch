import { createDb, type Database } from "@firewatch/db";

let db: Database | null = null;

/**
 * Get (or create) the database connection.
 * Uses a singleton pattern — one connection pool for the whole API.
 */
export function getDb(): Database {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env and fill in your database URL."
      );
    }
    db = createDb(url);
  }
  return db;
}
