import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { accountsRoute } from "./routes/accounts";
import { goalsRoute } from "./routes/goals";

/**
 * The Hono app — pure route definitions, no server-specific code.
 * This file is imported by both:
 * - index.ts (to start the server)
 * - The frontend (for Hono RPC type inference)
 */
const app = new Hono()
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: "*", // Configured per-environment in index.ts
      credentials: true,
    })
  )
  .get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))
  .route("/api/accounts", accountsRoute)
  .route("/api/goals", goalsRoute);

export type AppType = typeof app;
export default app;
