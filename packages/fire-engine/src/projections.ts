/**
 * Multi-account projection engine.
 *
 * Projects net worth growth across multiple accounts simultaneously,
 * breaking down by tax treatment so users can see how each bucket
 * contributes to their FIRE target over time.
 */

import { projectGrowth, type ProjectionYear } from "./calculators";

export interface AccountProjectionInput {
  name: string;
  taxTreatment: string;
  startingBalance: number;
  annualContribution: number;
  annualReturnRate: number;
}

export interface MultiAccountProjectionInput {
  accounts: AccountProjectionInput[];
  years: number;
  inflationRate?: number;
  fireTarget?: number;
}

export interface ProjectionByYear {
  year: number;
  totalBalance: number;
  totalBalanceReal: number;
  totalContributions: number;
  totalGrowth: number;
  byTaxTreatment: Record<string, number>;
  byAccount: Record<string, number>;
  fireTarget?: number;
  fireReached: boolean;
}

const TAX_TREATMENT_LABELS: Record<string, string> = {
  tax_deferred: "Tax-Deferred",
  tax_free: "Tax-Free",
  taxable: "Taxable",
  tax_advantaged: "Tax-Advantaged",
};

export function getTaxTreatmentLabel(key: string): string {
  return TAX_TREATMENT_LABELS[key] ?? key;
}

/**
 * Project growth for multiple accounts, aggregated by year.
 *
 * Returns year-by-year totals with breakdowns by:
 * - Tax treatment (tax_deferred, tax_free, taxable, tax_advantaged)
 * - Individual account name
 * - Inflation-adjusted values
 * - Whether FIRE target has been reached
 */
export function projectMultiAccount(
  input: MultiAccountProjectionInput
): ProjectionByYear[] {
  const { accounts, years, inflationRate, fireTarget } = input;

  // Project each account individually
  const accountProjections = accounts.map((account) => ({
    ...account,
    projection: projectGrowth({
      startingBalance: account.startingBalance,
      annualContribution: account.annualContribution,
      annualReturnRate: account.annualReturnRate,
      years,
      inflationRate,
    }),
  }));

  // Aggregate by year
  const result: ProjectionByYear[] = [];

  for (let y = 0; y < years; y++) {
    const byTaxTreatment: Record<string, number> = {};
    const byAccount: Record<string, number> = {};
    let totalBalance = 0;
    let totalBalanceReal = 0;
    let totalContributions = 0;
    let totalGrowth = 0;

    for (const ap of accountProjections) {
      const yearData = ap.projection[y]!;

      totalBalance += yearData.balance;
      totalBalanceReal += yearData.balanceReal;
      totalContributions += yearData.contributions;
      totalGrowth += yearData.growth;

      byTaxTreatment[ap.taxTreatment] =
        (byTaxTreatment[ap.taxTreatment] ?? 0) + yearData.balance;

      byAccount[ap.name] = yearData.balance;
    }

    result.push({
      year: y + 1,
      totalBalance: Math.round(totalBalance),
      totalBalanceReal: Math.round(totalBalanceReal),
      totalContributions: Math.round(totalContributions),
      totalGrowth: Math.round(totalGrowth),
      byTaxTreatment: Object.fromEntries(
        Object.entries(byTaxTreatment).map(([k, v]) => [k, Math.round(v)])
      ),
      byAccount: Object.fromEntries(
        Object.entries(byAccount).map(([k, v]) => [k, Math.round(v)])
      ),
      fireTarget,
      fireReached: fireTarget ? totalBalance >= fireTarget : false,
    });
  }

  return result;
}
