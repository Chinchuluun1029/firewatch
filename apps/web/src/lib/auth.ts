import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for the frontend.
 *
 * This gives us React hooks like useSession(), signIn(), signUp(), signOut()
 * that talk to the Better Auth routes on our Hono API.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
});

export const { useSession, signIn, signUp, signOut } = authClient;
