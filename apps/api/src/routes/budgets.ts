import { Hono } from "hono";
import { z } from "zod/v4";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import {
  budgets,
  budgetCategories,
  budgetEntries,
} from "@firewatch/db";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@firewatch/types";
import { getDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";

const createBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM format"),
});

const upsertEntrySchema = z.object({
  categoryId: z.string().min(1),
  planned: z.string().regex(/^\d+(\.\d{1,2})?$/),
  actual: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["income", "expense"]),
  color: z.string().max(20).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
});

/**
 * Budget routes — monthly income & expense tracking.
 *
 * How budgeting works in Firewatch:
 * 1. User creates budget categories (or uses defaults on first budget)
 * 2. User creates a monthly budget (e.g. "April 2026")
 * 3. For each category, user sets "planned" and "actual" amounts
 * 4. Dashboard shows planned vs actual with over/under indicators
 */
export const budgetsRoute = new Hono<{
  Variables: { user: { id: string; name: string; email: string } };
}>()
  .use("*", authMiddleware)

  // ─── Categories ──────────────────────────────────────────

  // List user's budget categories
  .get("/categories", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;

    const categories = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.userId, userId));

    return c.json({ categories });
  })

  // Seed default categories (called on first budget creation)
  .post("/categories/seed", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;

    // Check if user already has categories
    const existing = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.userId, userId));

    if (existing.length > 0) {
      return c.json({ categories: existing, seeded: false });
    }

    const allCategories = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
        id: crypto.randomUUID(),
        userId,
        name,
        type: "expense" as const,
        isDefault: true,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
        id: crypto.randomUUID(),
        userId,
        name,
        type: "income" as const,
        isDefault: true,
      })),
    ];

    const seeded = await db
      .insert(budgetCategories)
      .values(allCategories)
      .returning();

    return c.json({ categories: seeded, seeded: true }, 201);
  })

  // Create a custom category
  .post("/categories", zValidator("json", createCategorySchema), async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const body = c.req.valid("json");

    const id = crypto.randomUUID();
    const [category] = await db
      .insert(budgetCategories)
      .values({
        id,
        userId,
        name: body.name,
        type: body.type,
        color: body.color ?? null,
        icon: body.icon ?? null,
        isDefault: false,
      })
      .returning();

    return c.json({ category }, 201);
  })

  // Delete a custom category
  .delete("/categories/:id", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const categoryId = c.req.param("id");

    const [deleted] = await db
      .delete(budgetCategories)
      .where(
        and(
          eq(budgetCategories.id, categoryId),
          eq(budgetCategories.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return c.json({ error: "Category not found" }, 404);
    }

    return c.json({ message: "Category deleted" });
  })

  // ─── Budgets ─────────────────────────────────────────────

  // List all budgets for the user
  .get("/", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;

    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId))
      .orderBy(budgets.month);

    return c.json({ budgets: userBudgets });
  })

  // Get a single budget with all its entries
  .get("/:id", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const budgetId = c.req.param("id");

    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));

    if (!budget) {
      return c.json({ error: "Budget not found" }, 404);
    }

    const entries = await db
      .select({
        id: budgetEntries.id,
        budgetId: budgetEntries.budgetId,
        categoryId: budgetEntries.categoryId,
        planned: budgetEntries.planned,
        actual: budgetEntries.actual,
        categoryName: budgetCategories.name,
        categoryType: budgetCategories.type,
        categoryColor: budgetCategories.color,
      })
      .from(budgetEntries)
      .innerJoin(
        budgetCategories,
        eq(budgetEntries.categoryId, budgetCategories.id)
      )
      .where(eq(budgetEntries.budgetId, budgetId));

    return c.json({ budget, entries });
  })

  // Create a new monthly budget
  .post("/", zValidator("json", createBudgetSchema), async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const body = c.req.valid("json");

    // Check for duplicate month
    const [existing] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.month, body.month)));

    if (existing) {
      return c.json(
        { error: "A budget for this month already exists", budgetId: existing.id },
        409
      );
    }

    const id = crypto.randomUUID();
    const [budget] = await db
      .insert(budgets)
      .values({
        id,
        userId,
        name: body.name,
        month: body.month,
      })
      .returning();

    return c.json({ budget }, 201);
  })

  // Delete a budget
  .delete("/:id", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const budgetId = c.req.param("id");

    const [deleted] = await db
      .delete(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)))
      .returning();

    if (!deleted) {
      return c.json({ error: "Budget not found" }, 404);
    }

    return c.json({ message: "Budget deleted" });
  })

  // ─── Entries ─────────────────────────────────────────────

  // Add or update a budget entry (planned & actual for a category)
  .put("/:id/entries", zValidator("json", upsertEntrySchema), async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const budgetId = c.req.param("id");
    const body = c.req.valid("json");

    // Verify budget belongs to user
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));

    if (!budget) {
      return c.json({ error: "Budget not found" }, 404);
    }

    // Check if entry exists for this category
    const [existing] = await db
      .select()
      .from(budgetEntries)
      .where(
        and(
          eq(budgetEntries.budgetId, budgetId),
          eq(budgetEntries.categoryId, body.categoryId)
        )
      );

    if (existing) {
      // Update existing entry
      const [updated] = await db
        .update(budgetEntries)
        .set({
          planned: body.planned,
          actual: body.actual,
          updatedAt: new Date(),
        })
        .where(eq(budgetEntries.id, existing.id))
        .returning();

      return c.json({ entry: updated });
    } else {
      // Create new entry
      const id = crypto.randomUUID();
      const [entry] = await db
        .insert(budgetEntries)
        .values({
          id,
          budgetId,
          categoryId: body.categoryId,
          planned: body.planned,
          actual: body.actual,
        })
        .returning();

      return c.json({ entry }, 201);
    }
  })

  // Delete a budget entry
  .delete("/:budgetId/entries/:entryId", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const budgetId = c.req.param("budgetId");
    const entryId = c.req.param("entryId");

    // Verify budget belongs to user
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));

    if (!budget) {
      return c.json({ error: "Budget not found" }, 404);
    }

    const [deleted] = await db
      .delete(budgetEntries)
      .where(
        and(
          eq(budgetEntries.id, entryId),
          eq(budgetEntries.budgetId, budgetId)
        )
      )
      .returning();

    if (!deleted) {
      return c.json({ error: "Entry not found" }, 404);
    }

    return c.json({ message: "Entry deleted" });
  });
