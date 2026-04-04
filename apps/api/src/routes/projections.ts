import { Hono } from "hono";
import { z } from "zod/v4";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { accounts, fireGoals } from "@firewatch/db";
import { getDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import {
  projectMultiAccount,
  calculateYearsToFire,
} from "@firewatch/fire-engine";

const projectionParamsSchema = z.object({
  years: z.number().min(1).max(50).default(30),
  inflationRate: z.number().min(0).max(0.2).default(0.03),
  contributions: z
    .array(
      z.object({
        accountId: z.string(),
        annualContribution: z.number().min(0),
        annualReturnRate: z.number().min(-0.5).max(0.5),
      })
    )
    .optional(),
});

/**
 * Projections API — calculates future net worth scenarios.
 *
 * Takes the user's current accounts, applies growth assumptions,
 * and returns year-by-year projections broken down by account
 * and tax treatment.
 */
export const projectionsRoute = new Hono<{
  Variables: { user: { id: string; name: string; email: string } };
}>()
  .use("*", authMiddleware)

  // Generate projections based on current accounts
  .post("/", zValidator("json", projectionParamsSchema), async (c) => {
    const db = getDb();
    const userId = c.get("user").id;
    const params = c.req.valid("json");

    // Fetch user's accounts
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));

    // Fetch user's active FIRE goals for target lines
    const goals = await db
      .select()
      .from(fireGoals)
      .where(and(eq(fireGoals.userId, userId), eq(fireGoals.isActive, true)));

    const primaryGoal = goals[0];
    const fireTarget = primaryGoal
      ? Number(primaryGoal.targetNetWorth)
      : undefined;

    // Default return rates by tax treatment
    const defaultRates: Record<string, number> = {
      tax_deferred: 0.07,
      tax_free: 0.07,
      taxable: 0.06,
      tax_advantaged: 0.07,
    };

    // Build contribution overrides map
    const contributionMap = new Map(
      (params.contributions ?? []).map((c) => [c.accountId, c])
    );

    // Build account projection inputs
    const accountInputs = userAccounts.map((acct) => {
      const override = contributionMap.get(acct.id);
      return {
        name: acct.name,
        taxTreatment: acct.taxTreatment,
        startingBalance: Number(acct.currentBalance),
        annualContribution: override?.annualContribution ?? 0,
        annualReturnRate:
          override?.annualReturnRate ??
          defaultRates[acct.taxTreatment] ??
          0.06,
      };
    });

    const projection = projectMultiAccount({
      accounts: accountInputs,
      years: params.years,
      inflationRate: params.inflationRate,
      fireTarget,
    });

    // Calculate years to FIRE
    const totalNetWorth = userAccounts.reduce(
      (sum, a) => sum + Number(a.currentBalance),
      0
    );
    const totalContributions = accountInputs.reduce(
      (sum, a) => sum + a.annualContribution,
      0
    );
    const avgReturnRate =
      accountInputs.length > 0
        ? accountInputs.reduce(
            (sum, a) => sum + a.annualReturnRate * a.startingBalance,
            0
          ) / Math.max(totalNetWorth, 1)
        : 0.07;

    const yearsToFire = fireTarget
      ? calculateYearsToFire({
          fireNumber: fireTarget,
          currentNetWorth: totalNetWorth,
          annualSavings: totalContributions,
          annualReturnRate: avgReturnRate,
        })
      : null;

    return c.json({
      projection,
      summary: {
        currentNetWorth: totalNetWorth,
        fireTarget,
        yearsToFire:
          yearsToFire === Infinity ? null : yearsToFire
            ? Math.round(yearsToFire * 10) / 10
            : null,
        totalAnnualContributions: totalContributions,
        accountCount: userAccounts.length,
        goalName: primaryGoal?.name ?? null,
      },
    });
  });
