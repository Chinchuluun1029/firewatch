import { Hono } from "hono";
import { z } from "zod/v4";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { accounts } from "@firewatch/db";
import { getDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  institution: z.string().max(100).nullable().optional(),
  category: z.enum([
    "retirement",
    "brokerage",
    "savings",
    "hsa",
    "education",
    "real_estate",
    "crypto",
    "other",
  ]),
  taxTreatment: z.enum([
    "tax_deferred",
    "tax_free",
    "taxable",
    "tax_advantaged",
  ]),
  currentBalance: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid dollar amount"),
});

const updateAccountSchema = createAccountSchema.partial();

/**
 * Account routes — CRUD for financial accounts.
 *
 * All routes require authentication. Each user can only see/modify their own accounts.
 */
export const accountsRoute = new Hono<{
  Variables: { user: { id: string; name: string; email: string } };
}>()
  .use("*", authMiddleware)

  // List all accounts for the current user
  .get("/", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;

    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));

    return c.json({ accounts: userAccounts });
  })

  // Create a new account
  .post("/", zValidator("json", createAccountSchema), async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const body = c.req.valid("json");

    const id = crypto.randomUUID();
    const [account] = await db
      .insert(accounts)
      .values({
        id,
        userId,
        name: body.name,
        institution: body.institution ?? null,
        category: body.category,
        taxTreatment: body.taxTreatment,
        currentBalance: body.currentBalance ?? "0",
        source: "manual",
      })
      .returning();

    return c.json({ account }, 201);
  })

  // Get a single account
  .get("/:id", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const accountId = c.req.param("id");

    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }

    return c.json({ account });
  })

  // Update an account
  .patch("/:id", zValidator("json", updateAccountSchema), async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const accountId = c.req.param("id");
    const body = c.req.valid("json");

    const [updated] = await db
      .update(accounts)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
      .returning();

    if (!updated) {
      return c.json({ error: "Account not found" }, 404);
    }

    return c.json({ account: updated });
  })

  // Soft-delete an account (set isActive = false)
  .delete("/:id", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const accountId = c.req.param("id");

    const [deleted] = await db
      .update(accounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
      .returning();

    if (!deleted) {
      return c.json({ error: "Account not found" }, 404);
    }

    return c.json({ message: "Account deleted" });
  });
