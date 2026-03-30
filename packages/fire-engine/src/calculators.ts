/**
 * Core FIRE calculators.
 *
 * All formulas sourced from established FIRE methodology:
 * - FIRE Number = Annual Expenses × (1 / SWR)
 * - Safe Withdrawal Rate (SWR) = 4% (traditional, based on Trinity Study)
 * - Years to FIRE uses the future value of annuity formula
 * - Coast FIRE = FIRE Number / (1 + r)^years_remaining
 * - Real Return = (1 + nominal) / (1 + inflation) - 1
 */

export interface FireInput {
  annualExpenses: number;
  safeWithdrawalRate?: number; // defaults to 0.04 (4%)
}

export interface YearsToFireInput {
  fireNumber: number;
  currentNetWorth: number;
  annualSavings: number;
  annualReturnRate: number; // real return, e.g., 0.05 for 5%
}

export interface CoastFireInput {
  fireNumber: number;
  annualReturnRate: number;
  yearsUntilRetirement: number;
}

export interface ProjectionInput {
  startingBalance: number;
  annualContribution: number;
  annualReturnRate: number;
  years: number;
  inflationRate?: number; // defaults to 0.03 (3%)
}

export interface ProjectionYear {
  year: number;
  balance: number;
  contributions: number;
  growth: number;
  balanceReal: number; // inflation-adjusted
}

/**
 * Calculate the FIRE number — how much you need invested to retire.
 * FIRE Number = Annual Expenses × (1 / Safe Withdrawal Rate)
 *
 * Example: $50,000/year spending ÷ 0.04 = $1,250,000 needed
 */
export function calculateFireNumber(input: FireInput): number {
  const swr = input.safeWithdrawalRate ?? 0.04;
  if (swr <= 0 || swr > 1) {
    throw new Error("Safe withdrawal rate must be between 0 and 1");
  }
  return input.annualExpenses / swr;
}

/**
 * Calculate years until FIRE using the future value of annuity formula.
 * Returns Infinity if savings rate or return can't reach the goal.
 */
export function calculateYearsToFire(input: YearsToFireInput): number {
  const { fireNumber, currentNetWorth, annualSavings, annualReturnRate } = input;

  if (currentNetWorth >= fireNumber) return 0;
  if (annualSavings <= 0 && annualReturnRate <= 0) return Infinity;

  // If no growth, it's simple division
  if (annualReturnRate === 0) {
    const remaining = fireNumber - currentNetWorth;
    return remaining / annualSavings;
  }

  const r = annualReturnRate;
  // Future value formula: FV = PV(1+r)^n + PMT × ((1+r)^n - 1) / r
  // Solve for n: ln((FV × r + PMT) / (PV × r + PMT)) / ln(1 + r)
  const numerator = Math.log(
    (fireNumber * r + annualSavings) / (currentNetWorth * r + annualSavings)
  );
  const denominator = Math.log(1 + r);
  const years = numerator / denominator;

  return years > 0 ? years : Infinity;
}

/**
 * Calculate Coast FIRE number — how much you need NOW so that
 * compound growth alone reaches your FIRE number by retirement age.
 *
 * Coast FIRE = FIRE Number / (1 + r)^years_remaining
 */
export function calculateCoastFire(input: CoastFireInput): number {
  const { fireNumber, annualReturnRate, yearsUntilRetirement } = input;
  return fireNumber / Math.pow(1 + annualReturnRate, yearsUntilRetirement);
}

/**
 * Convert nominal return to real (inflation-adjusted) return.
 * Real Return = (1 + nominal) / (1 + inflation) - 1
 */
export function realReturn(nominalRate: number, inflationRate: number): number {
  return (1 + nominalRate) / (1 + inflationRate) - 1;
}

/**
 * Project account growth year-by-year.
 * Returns both nominal and inflation-adjusted (real) balances.
 */
export function projectGrowth(input: ProjectionInput): ProjectionYear[] {
  const { startingBalance, annualContribution, annualReturnRate, years } = input;
  const inflation = input.inflationRate ?? 0.03;

  const result: ProjectionYear[] = [];
  let balance = startingBalance;
  let totalContributions = startingBalance;

  for (let year = 1; year <= years; year++) {
    const growth = balance * annualReturnRate;
    balance = balance + growth + annualContribution;
    totalContributions += annualContribution;

    result.push({
      year,
      balance: Math.round(balance * 100) / 100,
      contributions: Math.round(totalContributions * 100) / 100,
      growth: Math.round((balance - totalContributions) * 100) / 100,
      balanceReal:
        Math.round((balance / Math.pow(1 + inflation, year)) * 100) / 100,
    });
  }

  return result;
}

/**
 * Calculate FIRE progress as a percentage.
 */
export function fireProgress(currentNetWorth: number, fireNumber: number): number {
  if (fireNumber <= 0) return 100;
  return Math.min(100, Math.round((currentNetWorth / fireNumber) * 10000) / 100);
}
