import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { accountsRoute } from "./routes/accounts";
import { goalsRoute } from "./routes/goals";
import { budgetsRoute } from "./routes/budgets";
import { auth } from "./lib/auth";

/**
 * Creates the Hono app. Accepts config to avoid `process.env` references
 * in this file — keeps it importable by the frontend for type inference.
 */
export function createApp(config?: { corsOrigin?: string }) {
  const app = new Hono()
    .use("*", logger())
    .use(
      "*",
      cors({
        origin: config?.corsOrigin ?? "*",
        credentials: true,
      })
    )
    .get("/health", (c) =>
      c.json({ status: "ok", timestamp: new Date().toISOString() })
    )
    .on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))
    .route("/api/accounts", accountsRoute)
    .route("/api/goals", goalsRoute)
    .route("/api/budgets", budgetsRoute);

  return app;
}

// Default instance for type inference (used by frontend via Hono RPC)
const app = createApp();
export type AppType = typeof app;
export default app;
