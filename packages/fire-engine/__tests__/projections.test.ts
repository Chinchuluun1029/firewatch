import { describe, it, expect } from "vitest";
import { projectMultiAccount } from "../src/projections";

describe("projectMultiAccount", () => {
  it("projects multiple accounts with different tax treatments", () => {
    const result = projectMultiAccount({
      accounts: [
        {
          name: "401(k)",
          taxTreatment: "tax_deferred",
          startingBalance: 100_000,
          annualContribution: 20_000,
          annualReturnRate: 0.07,
        },
        {
          name: "Roth IRA",
          taxTreatment: "tax_free",
          startingBalance: 50_000,
          annualContribution: 7_000,
          annualReturnRate: 0.07,
        },
        {
          name: "Brokerage",
          taxTreatment: "taxable",
          startingBalance: 30_000,
          annualContribution: 10_000,
          annualReturnRate: 0.06,
        },
      ],
      years: 10,
      inflationRate: 0.03,
    });

    expect(result).toHaveLength(10);

    // Year 1 should aggregate all accounts
    const y1 = result[0]!;
    expect(y1.year).toBe(1);
    expect(y1.totalBalance).toBeGreaterThan(180_000); // sum of starting + contributions + growth
    expect(y1.byTaxTreatment).toHaveProperty("tax_deferred");
    expect(y1.byTaxTreatment).toHaveProperty("tax_free");
    expect(y1.byTaxTreatment).toHaveProperty("taxable");
    expect(y1.byAccount).toHaveProperty("401(k)");
    expect(y1.byAccount).toHaveProperty("Roth IRA");
    expect(y1.byAccount).toHaveProperty("Brokerage");

    // Total should grow each year
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.totalBalance).toBeGreaterThan(result[i - 1]!.totalBalance);
    }

    // Real balance should be less than nominal
    const y10 = result[9]!;
    expect(y10.totalBalanceReal).toBeLessThan(y10.totalBalance);

    // FIRE not set, so fireReached should be false
    expect(y10.fireReached).toBe(false);
  });

  it("marks FIRE reached when target is hit", () => {
    const result = projectMultiAccount({
      accounts: [
        {
          name: "Main",
          taxTreatment: "taxable",
          startingBalance: 900_000,
          annualContribution: 50_000,
          annualReturnRate: 0.07,
        },
      ],
      years: 5,
      fireTarget: 1_000_000,
    });

    // Should reach $1M within year 1 (900k + 63k growth + 50k contribution)
    expect(result[0]!.fireReached).toBe(true);

    // All subsequent years should also be reached
    expect(result[4]!.fireReached).toBe(true);
  });

  it("handles single account", () => {
    const result = projectMultiAccount({
      accounts: [
        {
          name: "Savings",
          taxTreatment: "taxable",
          startingBalance: 10_000,
          annualContribution: 5_000,
          annualReturnRate: 0.05,
        },
      ],
      years: 3,
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.byAccount["Savings"]).toBeDefined();
  });

  it("handles zero accounts", () => {
    const result = projectMultiAccount({
      accounts: [],
      years: 5,
    });

    expect(result).toHaveLength(5);
    expect(result[0]!.totalBalance).toBe(0);
  });
});
