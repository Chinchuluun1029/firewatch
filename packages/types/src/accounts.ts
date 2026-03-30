/**
 * Account types with their tax treatment.
 * Designed to support US account types with room for expansion.
 */

export type AccountTaxTreatment =
  | "tax_deferred"   // 401k, Traditional IRA — taxed on withdrawal
  | "tax_free"       // Roth IRA, Roth 401k — tax-free growth & withdrawal
  | "taxable"        // Brokerage — capital gains + dividends taxed
  | "tax_advantaged"; // HSA, 529 — special tax rules

export type AccountCategory =
  | "retirement"
  | "brokerage"
  | "savings"
  | "hsa"
  | "education"
  | "real_estate"
  | "crypto"
  | "other";

export interface Account {
  id: string;
  userId: string;
  name: string;
  institution: string | null;
  category: AccountCategory;
  taxTreatment: AccountTaxTreatment;
  currentBalance: number;
  currency: string; // USD for v1
  source: "manual" | "plaid" | "import"; // ready for Plaid integration
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceSnapshot {
  id: string;
  accountId: string;
  balance: number;
  date: string;
  source: "manual" | "plaid" | "calculated";
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  description: string | null;
  date: string;
  source: "manual" | "plaid" | "import";
  createdAt: string;
}
