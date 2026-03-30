import { Hono } from "hono";

/**
 * Account routes — CRUD for financial accounts.
 * These are stub routes to validate the structure.
 * Real implementation comes in Milestone 1.
 */
export const accountsRoute = new Hono()
  .get("/", (c) => {
    return c.json({ accounts: [], message: "Account listing — coming soon" });
  })
  .post("/", (c) => {
    return c.json({ message: "Create account — coming soon" }, 201);
  })
  .get("/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `Get account ${id} — coming soon` });
  });
