import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Auth (Better Auth tables) ───────────────────────────────
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authAccounts = pgTable("auth_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Financial Accounts ──────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  institution: text("institution"),
  category: text("category").notNull(), // retirement, brokerage, savings, etc.
  taxTreatment: text("tax_treatment").notNull(), // tax_deferred, tax_free, taxable, etc.
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  currency: text("currency").notNull().default("USD"),
  source: text("source").notNull().default("manual"), // manual, plaid, import
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Balance Snapshots ───────────────────────────────────────
export const balanceSnapshots = pgTable("balance_snapshots", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Transactions ────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  type: text("type").notNull(), // income, expense, transfer
  category: text("category").notNull(),
  description: text("description"),
  date: text("date").notNull(), // YYYY-MM-DD
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── FIRE Goals ──────────────────────────────────────────────
export const fireGoals = pgTable("fire_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // leanfire, fire, chubbyfire, fatfire, etc.
  targetNetWorth: numeric("target_net_worth", { precision: 14, scale: 2 }).notNull(),
  targetAnnualSpending: numeric("target_annual_spending", {
    precision: 14,
    scale: 2,
  }).notNull(),
  safeWithdrawalRate: numeric("safe_withdrawal_rate", {
    precision: 5,
    scale: 4,
  })
    .notNull()
    .default("0.0400"),
  targetDate: text("target_date"), // YYYY-MM-DD or null
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── FIRE Milestones ─────────────────────────────────────────
export const fireMilestones = pgTable("fire_milestones", {
  id: text("id").primaryKey(),
  goalId: text("goal_id")
    .notNull()
    .references(() => fireGoals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).notNull(),
  reachedAt: timestamp("reached_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Budgets ─────────────────────────────────────────────────
export const budgets = pgTable("budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  month: text("month").notNull(), // YYYY-MM
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // income, expense
  color: text("color"),
  icon: text("icon"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const budgetEntries = pgTable("budget_entries", {
  id: text("id").primaryKey(),
  budgetId: text("budget_id")
    .notNull()
    .references(() => budgets.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => budgetCategories.id),
  planned: numeric("planned", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  actual: numeric("actual", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
