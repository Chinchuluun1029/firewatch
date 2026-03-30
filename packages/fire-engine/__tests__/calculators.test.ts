import { describe, it, expect } from "vitest";
import {
  calculateFireNumber,
  calculateYearsToFire,
  calculateCoastFire,
  realReturn,
  projectGrowth,
  fireProgress,
} from "../src/calculators";

describe("calculateFireNumber", () => {
  it("calculates standard FIRE number with 4% SWR", () => {
    // $50k/year spending ÷ 4% = $1.25M
    expect(calculateFireNumber({ annualExpenses: 50_000 })).toBe(1_250_000);
  });

  it("calculates with custom SWR", () => {
    // $50k/year spending ÷ 3.5% = ~$1.43M
    expect(
      calculateFireNumber({ annualExpenses: 50_000, safeWithdrawalRate: 0.035 })
    ).toBeCloseTo(1_428_571.43, 0);
  });

  it("throws for invalid SWR", () => {
    expect(() =>
      calculateFireNumber({ annualExpenses: 50_000, safeWithdrawalRate: 0 })
    ).toThrow();
    expect(() =>
      calculateFireNumber({ annualExpenses: 50_000, safeWithdrawalRate: 1.5 })
    ).toThrow();
  });
});

describe("calculateYearsToFire", () => {
  it("returns 0 if already at FIRE number", () => {
    expect(
      calculateYearsToFire({
        fireNumber: 1_000_000,
        currentNetWorth: 1_000_000,
        annualSavings: 50_000,
        annualReturnRate: 0.07,
      })
    ).toBe(0);
  });

  it("calculates years for a typical scenario", () => {
    const years = calculateYearsToFire({
      fireNumber: 1_250_000,
      currentNetWorth: 100_000,
      annualSavings: 50_000,
      annualReturnRate: 0.07,
    });
    // Should be around 13-14 years
    expect(years).toBeGreaterThan(12);
    expect(years).toBeLessThan(16);
  });

  it("handles zero return rate", () => {
    const years = calculateYearsToFire({
      fireNumber: 500_000,
      currentNetWorth: 0,
      annualSavings: 50_000,
      annualReturnRate: 0,
    });
    expect(years).toBe(10);
  });

  it("returns Infinity when goal is unreachable", () => {
    expect(
      calculateYearsToFire({
        fireNumber: 1_000_000,
        currentNetWorth: 0,
        annualSavings: 0,
        annualReturnRate: 0,
      })
    ).toBe(Infinity);
  });
});

describe("calculateCoastFire", () => {
  it("calculates Coast FIRE number", () => {
    // Need $1.25M at retirement, 7% return, 20 years away
    const coastNumber = calculateCoastFire({
      fireNumber: 1_250_000,
      annualReturnRate: 0.07,
      yearsUntilRetirement: 20,
    });
    // $1.25M / (1.07)^20 ≈ $323k
    expect(coastNumber).toBeCloseTo(323_015, -2);
  });
});

describe("realReturn", () => {
  it("converts nominal to real return", () => {
    // 7% nominal - 3% inflation ≈ 3.88% real
    expect(realReturn(0.07, 0.03)).toBeCloseTo(0.0388, 3);
  });
});

describe("projectGrowth", () => {
  it("projects growth over multiple years", () => {
    const projection = projectGrowth({
      startingBalance: 100_000,
      annualContribution: 20_000,
      annualReturnRate: 0.07,
      years: 5,
    });

    expect(projection).toHaveLength(5);
    expect(projection[0]!.year).toBe(1);
    expect(projection[4]!.year).toBe(5);

    // Balance should grow each year
    for (let i = 1; i < projection.length; i++) {
      expect(projection[i]!.balance).toBeGreaterThan(projection[i - 1]!.balance);
    }

    // Real balance should be less than nominal (inflation erodes value)
    expect(projection[4]!.balanceReal).toBeLessThan(projection[4]!.balance);
  });

  it("handles zero contribution", () => {
    const projection = projectGrowth({
      startingBalance: 100_000,
      annualContribution: 0,
      annualReturnRate: 0.07,
      years: 10,
    });

    // $100k × 1.07^10 ≈ $196,715
    expect(projection[9]!.balance).toBeCloseTo(196_715, -2);
  });
});

describe("fireProgress", () => {
  it("calculates progress percentage", () => {
    expect(fireProgress(500_000, 1_000_000)).toBe(50);
  });

  it("caps at 100%", () => {
    expect(fireProgress(1_500_000, 1_000_000)).toBe(100);
  });

  it("returns 100 for zero target", () => {
    expect(fireProgress(100, 0)).toBe(100);
  });
});
