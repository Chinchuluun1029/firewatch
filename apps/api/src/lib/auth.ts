import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import {
  users,
  sessions,
  authAccounts,
  verifications,
} from "@firewatch/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;

/**
 * Better Auth server configuration (lazy-initialized).
 *
 * Lazily initialized so process.env is only read at runtime,
 * not at import time — this keeps app.ts importable by the frontend.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = new Proxy({}, {
  get(_, prop) {
    if (!_auth) {
      _auth = betterAuth({
        database: drizzleAdapter(getDb(), {
          provider: "pg",
          schema: {
            user: users,
            session: sessions,
            account: authAccounts,
            verification: verifications,
          },
        }),
        emailAndPassword: {
          enabled: true,
        },
        session: {
          expiresIn: 60 * 60 * 24 * 7,
          updateAge: 60 * 60 * 24,
        },
        trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:5173"],
      });
    }
    return (_auth as Record<string | symbol, unknown>)[prop];
  },
});
