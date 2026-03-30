import { Hono } from "hono";
import { z } from "zod/v4";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { fireGoals, fireMilestones } from "@firewatch/db";
import { getDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";

const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    "leanfire",
    "fire",
    "chubbyfire",
    "fatfire",
    "baristafire",
    "coastfire",
    "custom",
  ]),
  targetNetWorth: z.string().regex(/^\d+(\.\d{1,2})?$/),
  targetAnnualSpending: z.string().regex(/^\d+(\.\d{1,2})?$/),
  safeWithdrawalRate: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

const createMilestoneSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

/**
 * FIRE goal routes — CRUD for FIRE goals and milestones.
 *
 * Users can track multiple FIRE goals simultaneously
 * (e.g., LeanFIRE as a near-term goal + FatFIRE as a stretch goal).
 */
export const goalsRoute = new Hono<{
  Variables: { user: { id: string; name: string; email: string } };
}>()
  .use("*", authMiddleware)

  // List all FIRE goals for the current user
  .get("/", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;

    const goals = await db
      .select()
      .from(fireGoals)
      .where(and(eq(fireGoals.userId, userId), eq(fireGoals.isActive, true)));

    return c.json({ goals });
  })

  // Create a new FIRE goal
  .post("/", zValidator("json", createGoalSchema), async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const body = c.req.valid("json");

    const id = crypto.randomUUID();
    const [goal] = await db
      .insert(fireGoals)
      .values({
        id,
        userId,
        name: body.name,
        type: body.type,
        targetNetWorth: body.targetNetWorth,
        targetAnnualSpending: body.targetAnnualSpending,
        safeWithdrawalRate: body.safeWithdrawalRate ?? "0.0400",
        targetDate: body.targetDate ?? null,
      })
      .returning();

    return c.json({ goal }, 201);
  })

  // Get a single goal with its milestones
  .get("/:id", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const goalId = c.req.param("id");

    const [goal] = await db
      .select()
      .from(fireGoals)
      .where(and(eq(fireGoals.id, goalId), eq(fireGoals.userId, userId)));

    if (!goal) {
      return c.json({ error: "Goal not found" }, 404);
    }

    const milestones = await db
      .select()
      .from(fireMilestones)
      .where(eq(fireMilestones.goalId, goalId));

    return c.json({ goal, milestones });
  })

  // Add a milestone to a goal
  .post("/:id/milestones", zValidator("json", createMilestoneSchema), async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const goalId = c.req.param("id");
    const body = c.req.valid("json");

    // Verify the goal belongs to this user
    const [goal] = await db
      .select()
      .from(fireGoals)
      .where(and(eq(fireGoals.id, goalId), eq(fireGoals.userId, userId)));

    if (!goal) {
      return c.json({ error: "Goal not found" }, 404);
    }

    const id = crypto.randomUUID();
    const [milestone] = await db
      .insert(fireMilestones)
      .values({
        id,
        goalId,
        name: body.name,
        targetAmount: body.targetAmount,
      })
      .returning();

    return c.json({ milestone }, 201);
  })

  // Delete a FIRE goal (soft delete)
  .delete("/:id", async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const goalId = c.req.param("id");

    const [deleted] = await db
      .update(fireGoals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(fireGoals.id, goalId), eq(fireGoals.userId, userId)))
      .returning();

    if (!deleted) {
      return c.json({ error: "Goal not found" }, 404);
    }

    return c.json({ message: "Goal deleted" });
  });
