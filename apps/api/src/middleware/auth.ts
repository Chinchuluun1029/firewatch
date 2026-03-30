import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";

/**
 * Auth middleware — protects routes that require a logged-in user.
 *
 * How it works:
 * 1. Reads the session cookie from the incoming request
 * 2. Validates it against the database via Better Auth
 * 3. If valid, attaches the user to the Hono context (c.get("user"))
 * 4. If invalid, returns 401 Unauthorized
 *
 * Usage: app.use("/api/protected/*", authMiddleware)
 */
export const authMiddleware = createMiddleware<{
  Variables: {
    user: { id: string; name: string; email: string };
  };
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  });

  await next();
});
