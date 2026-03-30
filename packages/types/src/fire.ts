/**
 * FIRE goal types — the different flavors of financial independence.
 *
 * These thresholds are US-centric defaults. Users can set custom targets.
 */

export type FireType =
  | "leanfire"
  | "fire"
  | "chubbyfire"
  | "fatfire"
  | "baristafire"
  | "coastfire"
  | "custom";

export interface FireGoal {
  id: string;
  userId: string;
  name: string;
  type: FireType;
  targetNetWorth: number;
  targetAnnualSpending: number;
  safeWithdrawalRate: number;
  targetDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FireMilestone {
  id: string;
  goalId: string;
  name: string;
  targetAmount: number;
  reachedAt: string | null;
  createdAt: string;
}

/** Default FIRE thresholds (annual spending) */
export const FIRE_DEFAULTS: Record<
  Exclude<FireType, "custom">,
  { label: string; minSpending: number; maxSpending: number | null }
> = {
  leanfire: { label: "Lean FIRE", minSpending: 0, maxSpending: 40_000 },
  fire: { label: "FIRE", minSpending: 40_000, maxSpending: 100_000 },
  chubbyfire: {
    label: "Chubby FIRE",
    minSpending: 100_000,
    maxSpending: 200_000,
  },
  fatfire: { label: "Fat FIRE", minSpending: 200_000, maxSpending: 500_000 },
  baristafire: {
    label: "Barista FIRE",
    minSpending: 0,
    maxSpending: null,
  },
  coastfire: { label: "Coast FIRE", minSpending: 0, maxSpending: null },
};
