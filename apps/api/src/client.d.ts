/**
 * API types for the frontend Hono RPC client.
 *
 * This file re-exports only the TYPE from app.ts, preventing
 * the frontend's type-checker from following into runtime API code.
 */
export type { AppType } from "./app";
