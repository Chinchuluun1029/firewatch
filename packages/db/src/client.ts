import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

/**
 * Create a Drizzle database client.
 *
 * How this works:
 * 1. `postgres()` creates a connection pool to PostgreSQL
 * 2. `drizzle()` wraps it with Drizzle's type-safe query builder
 * 3. Passing `schema` lets us use Drizzle's relational queries
 *
 * The connection string comes from DATABASE_URL in your .env file.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
