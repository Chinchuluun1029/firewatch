/**
 * Budget types for income/expense tracking.
 */

export interface Budget {
  id: string;
  userId: string;
  name: string;
  month: string; // YYYY-MM format
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface BudgetEntry {
  id: string;
  budgetId: string;
  categoryId: string;
  planned: number;
  actual: number;
  createdAt: string;
  updatedAt: string;
}

/** Default expense categories for new users */
export const DEFAULT_EXPENSE_CATEGORIES = [
  "Housing",
  "Transportation",
  "Food & Dining",
  "Utilities",
  "Healthcare",
  "Insurance",
  "Entertainment",
  "Personal Care",
  "Clothing",
  "Education",
  "Savings & Investments",
  "Debt Payments",
  "Gifts & Donations",
  "Miscellaneous",
] as const;

/** Default income categories for new users */
export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance / Side Hustle",
  "Investment Income",
  "Rental Income",
  "Other Income",
] as const;
