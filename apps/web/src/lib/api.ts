import { hc } from "hono/client";
import type { AppType } from "@firewatch/api/src/app";

/**
 * Typed API client — powered by Hono RPC.
 *
 * This is the magic: the frontend automatically knows every API endpoint's
 * request/response types because Hono RPC reads them from the backend's
 * route definitions. No codegen, no manual typing.
 *
 * Usage:
 *   const res = await api.api.accounts.$get();
 *   const data = await res.json(); // ← fully typed!
 */
export const api = hc<AppType>(
  import.meta.env.VITE_API_URL ?? "http://localhost:3001"
);

/** Base URL for direct fetch calls */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
