import { serve } from "@hono/node-server";
import { createApp } from "./app";

export type { AppType } from "./app";

const port = Number(process.env.PORT ?? 3001);
const app = createApp({
  corsOrigin: process.env.FRONTEND_URL ?? "http://localhost:5173",
});

serve({ fetch: app.fetch, port }, () => {
  console.log(`🔥 Firewatch API running on http://localhost:${port}`);
});
