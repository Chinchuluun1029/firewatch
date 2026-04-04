import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { eq, and, desc } from "drizzle-orm";
import {
  accounts,
  fireGoals,
  budgets,
  budgetEntries,
  budgetCategories,
} from "@firewatch/db";
import { getDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import { fireProgress, calculateYearsToFire } from "@firewatch/fire-engine";
import OpenAI from "openai";

/**
 * AI Insights routes — personalized financial analysis.
 *
 * How it works:
 * 1. Gathers the user's full financial picture (accounts, budgets, goals)
 * 2. Structures it into a prompt for OpenAI
 * 3. Streams the response back for a smooth UX
 *
 * If OPENAI_API_KEY is not set, returns a structured static analysis
 * based on the user's data (no AI needed).
 */
export const insightsRoute = new Hono<{
  Variables: { user: { id: string; name: string; email: string } };
}>()
  .use("*", authMiddleware)

  // Get a snapshot of the user's financial data (useful for the UI)
  .get("/snapshot", async (c) => {
    const snapshot = await buildFinancialSnapshot(c.get("user").id);
    return c.json({ snapshot });
  })

  // Generate AI insights (streamed)
  .post("/generate", async (c) => {
    const userId = c.get("user").id;
    const snapshot = await buildFinancialSnapshot(userId);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "sk-your-key-here") {
      // No API key — return rule-based insights
      const insights = generateRuleBasedInsights(snapshot);
      return c.json({ insights, source: "rule-based" });
    }

    // Stream from OpenAI
    const openai = new OpenAI({ apiKey });
    const prompt = buildPrompt(snapshot);

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personal finance advisor AI embedded in Firewatch, a FIRE (Financial Independence / Retire Early) tracking app. 
Give actionable, specific insights based on the user's actual financial data.
Be encouraging but honest. Use concrete numbers from their data.
Format your response as markdown with clear sections.
Keep it concise — 4-6 key insights, each 2-3 sentences.
Always include a disclaimer that this is not professional financial advice.`,
        },
        { role: "user", content: prompt },
      ],
      stream: true,
      max_tokens: 1000,
    });

    return streamText(c, async (textStream) => {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          await textStream.write(content);
        }
      }
    });
  });

// ─── Helper Functions ────────────────────────────────────────

interface FinancialSnapshot {
  totalNetWorth: number;
  accounts: Array<{
    name: string;
    category: string;
    taxTreatment: string;
    balance: number;
  }>;
  goals: Array<{
    name: string;
    type: string;
    targetNetWorth: number;
    targetAnnualSpending: number;
    progress: number;
    yearsToFire: number | null;
  }>;
  latestBudget: {
    month: string;
    totalIncome: number;
    totalExpenses: number;
    savingsRate: number;
    topExpenses: Array<{ category: string; amount: number }>;
  } | null;
  accountBreakdown: {
    taxDeferred: number;
    taxFree: number;
    taxable: number;
    taxAdvantaged: number;
  };
}

async function buildFinancialSnapshot(
  userId: string
): Promise<FinancialSnapshot> {
  const db = getDb();

  // Fetch accounts
  const userAccounts = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));

  const totalNetWorth = userAccounts.reduce(
    (sum, a) => sum + Number(a.currentBalance),
    0
  );

  // Fetch goals
  const userGoals = await db
    .select()
    .from(fireGoals)
    .where(and(eq(fireGoals.userId, userId), eq(fireGoals.isActive, true)));

  // Fetch latest budget
  const [latestBudgetRow] = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId))
    .orderBy(desc(budgets.month))
    .limit(1);

  let latestBudget: FinancialSnapshot["latestBudget"] = null;

  if (latestBudgetRow) {
    const entries = await db
      .select({
        planned: budgetEntries.planned,
        actual: budgetEntries.actual,
        categoryName: budgetCategories.name,
        categoryType: budgetCategories.type,
      })
      .from(budgetEntries)
      .innerJoin(
        budgetCategories,
        eq(budgetEntries.categoryId, budgetCategories.id)
      )
      .where(eq(budgetEntries.budgetId, latestBudgetRow.id));

    const totalIncome = entries
      .filter((e) => e.categoryType === "income")
      .reduce((sum, e) => sum + Number(e.actual), 0);

    const totalExpenses = entries
      .filter((e) => e.categoryType === "expense")
      .reduce((sum, e) => sum + Number(e.actual), 0);

    const topExpenses = entries
      .filter((e) => e.categoryType === "expense" && Number(e.actual) > 0)
      .map((e) => ({ category: e.categoryName, amount: Number(e.actual) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    latestBudget = {
      month: latestBudgetRow.month,
      totalIncome,
      totalExpenses,
      savingsRate:
        totalIncome > 0
          ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
          : 0,
      topExpenses,
    };
  }

  const accountBreakdown = {
    taxDeferred: userAccounts
      .filter((a) => a.taxTreatment === "tax_deferred")
      .reduce((sum, a) => sum + Number(a.currentBalance), 0),
    taxFree: userAccounts
      .filter((a) => a.taxTreatment === "tax_free")
      .reduce((sum, a) => sum + Number(a.currentBalance), 0),
    taxable: userAccounts
      .filter((a) => a.taxTreatment === "taxable")
      .reduce((sum, a) => sum + Number(a.currentBalance), 0),
    taxAdvantaged: userAccounts
      .filter((a) => a.taxTreatment === "tax_advantaged")
      .reduce((sum, a) => sum + Number(a.currentBalance), 0),
  };

  return {
    totalNetWorth,
    accounts: userAccounts.map((a) => ({
      name: a.name,
      category: a.category,
      taxTreatment: a.taxTreatment,
      balance: Number(a.currentBalance),
    })),
    goals: userGoals.map((g) => {
      const target = Number(g.targetNetWorth);
      const progress = fireProgress(totalNetWorth, target);
      const ytf = calculateYearsToFire({
        fireNumber: target,
        currentNetWorth: totalNetWorth,
        annualSavings: latestBudget
          ? (latestBudget.totalIncome - latestBudget.totalExpenses) * 12
          : 0,
        annualReturnRate: 0.07,
      });
      return {
        name: g.name,
        type: g.type,
        targetNetWorth: target,
        targetAnnualSpending: Number(g.targetAnnualSpending),
        progress,
        yearsToFire: ytf === Infinity ? null : Math.round(ytf * 10) / 10,
      };
    }),
    latestBudget,
    accountBreakdown,
  };
}

function buildPrompt(snapshot: FinancialSnapshot): string {
  let prompt = `Here is my complete financial snapshot:\n\n`;
  prompt += `**Net Worth:** $${snapshot.totalNetWorth.toLocaleString()}\n\n`;

  prompt += `**Accounts:**\n`;
  for (const a of snapshot.accounts) {
    prompt += `- ${a.name} (${a.taxTreatment.replace("_", "-")}): $${a.balance.toLocaleString()}\n`;
  }

  prompt += `\n**Account Breakdown:**\n`;
  prompt += `- Tax-Deferred: $${snapshot.accountBreakdown.taxDeferred.toLocaleString()}\n`;
  prompt += `- Tax-Free: $${snapshot.accountBreakdown.taxFree.toLocaleString()}\n`;
  prompt += `- Taxable: $${snapshot.accountBreakdown.taxable.toLocaleString()}\n`;
  prompt += `- Tax-Advantaged: $${snapshot.accountBreakdown.taxAdvantaged.toLocaleString()}\n`;

  if (snapshot.goals.length > 0) {
    prompt += `\n**FIRE Goals:**\n`;
    for (const g of snapshot.goals) {
      prompt += `- ${g.name} (${g.type}): Target $${g.targetNetWorth.toLocaleString()}, `;
      prompt += `${g.progress}% progress`;
      if (g.yearsToFire) prompt += `, ~${g.yearsToFire} years away`;
      prompt += `\n`;
    }
  }

  if (snapshot.latestBudget) {
    const b = snapshot.latestBudget;
    prompt += `\n**Latest Budget (${b.month}):**\n`;
    prompt += `- Income: $${b.totalIncome.toLocaleString()}\n`;
    prompt += `- Expenses: $${b.totalExpenses.toLocaleString()}\n`;
    prompt += `- Savings Rate: ${b.savingsRate}%\n`;
    if (b.topExpenses.length > 0) {
      prompt += `- Top expenses: ${b.topExpenses.map((e) => `${e.category} ($${e.amount.toLocaleString()})`).join(", ")}\n`;
    }
  }

  prompt += `\nPlease analyze my financial situation and give me actionable FIRE insights. Focus on:\n`;
  prompt += `1. Overall progress and timeline assessment\n`;
  prompt += `2. Asset allocation across tax-advantaged vs taxable accounts\n`;
  prompt += `3. Savings rate analysis (is it enough for my FIRE goal?)\n`;
  prompt += `4. Specific recommendations to accelerate my FIRE date\n`;
  prompt += `5. Any risks or concerns I should address\n`;

  return prompt;
}

/**
 * Rule-based insights for when no OpenAI API key is configured.
 * Still useful — just not as personalized as AI-generated insights.
 */
function generateRuleBasedInsights(
  snapshot: FinancialSnapshot
): Array<{ title: string; body: string; type: "positive" | "warning" | "tip" }> {
  const insights: Array<{
    title: string;
    body: string;
    type: "positive" | "warning" | "tip";
  }> = [];

  // Net worth assessment
  if (snapshot.totalNetWorth > 0) {
    insights.push({
      title: "Net Worth Summary",
      body: `Your total net worth is $${snapshot.totalNetWorth.toLocaleString()} across ${snapshot.accounts.length} account(s). ${
        snapshot.accounts.length === 1
          ? "Consider diversifying across multiple account types for tax efficiency."
          : "Good diversification across multiple accounts."
      }`,
      type: "positive",
    });
  }

  // FIRE progress
  for (const goal of snapshot.goals) {
    if (goal.progress >= 100) {
      insights.push({
        title: `🎉 ${goal.name} — Goal Reached!`,
        body: `Congratulations! You've reached your ${goal.name} target of $${goal.targetNetWorth.toLocaleString()}.`,
        type: "positive",
      });
    } else if (goal.yearsToFire) {
      insights.push({
        title: `${goal.name} Progress`,
        body: `You're ${goal.progress}% of the way to your $${goal.targetNetWorth.toLocaleString()} target. At your current pace, you'll reach it in about ${goal.yearsToFire} years.`,
        type: goal.progress >= 50 ? "positive" : "tip",
      });
    }
  }

  // Savings rate
  if (snapshot.latestBudget) {
    const sr = snapshot.latestBudget.savingsRate;
    if (sr >= 50) {
      insights.push({
        title: "Excellent Savings Rate",
        body: `Your ${sr}% savings rate is exceptional — well above the 50% threshold that typically enables FIRE within 15-17 years. Keep it up!`,
        type: "positive",
      });
    } else if (sr >= 30) {
      insights.push({
        title: "Good Savings Rate",
        body: `Your ${sr}% savings rate is solid. To accelerate your FIRE timeline, see if you can push toward 50% — even small increases compound significantly over time.`,
        type: "tip",
      });
    } else if (sr >= 0) {
      insights.push({
        title: "Savings Rate Needs Attention",
        body: `Your ${sr}% savings rate may make your FIRE goals difficult to reach. The FIRE community typically targets 50%+. Look at your top expenses for potential cuts.`,
        type: "warning",
      });
    } else {
      insights.push({
        title: "Spending Exceeds Income",
        body: `You're spending more than you earn this month. Focus on reducing expenses or increasing income before investing aggressively.`,
        type: "warning",
      });
    }

    // Top expense analysis
    if (snapshot.latestBudget.topExpenses.length > 0) {
      const top = snapshot.latestBudget.topExpenses[0]!;
      const pct = Math.round(
        (top.amount / snapshot.latestBudget.totalExpenses) * 100
      );
      insights.push({
        title: "Biggest Expense",
        body: `${top.category} is your largest expense at $${top.amount.toLocaleString()} (${pct}% of total expenses). This is the highest-leverage area if you're looking to cut costs.`,
        type: "tip",
      });
    }
  }

  // Asset allocation
  const { taxDeferred, taxFree, taxable } = snapshot.accountBreakdown;
  const total = snapshot.totalNetWorth;
  if (total > 0) {
    if (taxFree === 0 && taxDeferred > 0) {
      insights.push({
        title: "Consider Tax-Free Accounts",
        body: `All your retirement savings are in tax-deferred accounts. Consider opening a Roth IRA for tax-free growth — this gives you flexibility in retirement to manage your tax bracket.`,
        type: "tip",
      });
    }
    if (taxable / total > 0.5 && total > 50_000) {
      insights.push({
        title: "Tax Efficiency Opportunity",
        body: `${Math.round((taxable / total) * 100)}% of your portfolio is in taxable accounts. Maximize tax-advantaged accounts (401k, IRA, HSA) first — they shelter your gains from annual taxation.`,
        type: "tip",
      });
    }
  }

  // No data edge case
  if (insights.length === 0) {
    insights.push({
      title: "Get Started",
      body: "Add your financial accounts, set a FIRE goal, and create a monthly budget to get personalized insights.",
      type: "tip",
    });
  }

  return insights;
}
