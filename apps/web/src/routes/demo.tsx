import { createFileRoute } from "@tanstack/react-router";
import {
  calculateFireNumber,
  calculateYearsToFire,
  projectGrowth,
  fireProgress,
} from "@firewatch/fire-engine";
import { useState } from "react";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

/**
 * Interactive FIRE simulator — no auth, no backend.
 * Runs entirely client-side with fake/user-entered data.
 */
function DemoPage() {
  const [annualExpenses, setAnnualExpenses] = useState(50_000);
  const [currentNetWorth, setCurrentNetWorth] = useState(100_000);
  const [annualSavings, setAnnualSavings] = useState(30_000);
  const [returnRate, setReturnRate] = useState(7);
  const [swr, setSwr] = useState(4);

  const fireNumber = calculateFireNumber({
    annualExpenses,
    safeWithdrawalRate: swr / 100,
  });

  const yearsToFire = calculateYearsToFire({
    fireNumber,
    currentNetWorth,
    annualSavings,
    annualReturnRate: returnRate / 100,
  });

  const progress = fireProgress(currentNetWorth, fireNumber);

  const projection = projectGrowth({
    startingBalance: currentNetWorth,
    annualContribution: annualSavings,
    annualReturnRate: returnRate / 100,
    years: Math.min(Math.ceil(yearsToFire) + 5, 50),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">🔥 FIRE Simulator</h1>
      <p className="mt-2 text-gray-600">
        Play with the numbers to see how different scenarios affect your path to
        financial independence. No sign-up required.
      </p>

      {/* Input controls */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <InputSlider
          label="Annual Expenses"
          value={annualExpenses}
          onChange={setAnnualExpenses}
          min={10_000}
          max={300_000}
          step={5_000}
          format="currency"
        />
        <InputSlider
          label="Current Net Worth"
          value={currentNetWorth}
          onChange={setCurrentNetWorth}
          min={0}
          max={2_000_000}
          step={10_000}
          format="currency"
        />
        <InputSlider
          label="Annual Savings"
          value={annualSavings}
          onChange={setAnnualSavings}
          min={0}
          max={200_000}
          step={5_000}
          format="currency"
        />
        <InputSlider
          label="Expected Return"
          value={returnRate}
          onChange={setReturnRate}
          min={1}
          max={15}
          step={0.5}
          format="percent"
        />
        <InputSlider
          label="Safe Withdrawal Rate"
          value={swr}
          onChange={setSwr}
          min={2}
          max={6}
          step={0.5}
          format="percent"
        />
      </div>

      {/* Results */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <ResultCard
          label="FIRE Number"
          value={formatCurrency(fireNumber)}
          sublabel="How much you need"
        />
        <ResultCard
          label="Years to FIRE"
          value={yearsToFire === Infinity ? "∞" : yearsToFire.toFixed(1)}
          sublabel={yearsToFire === Infinity ? "Not reachable" : "At current rate"}
        />
        <ResultCard
          label="Progress"
          value={`${progress}%`}
          sublabel={`${formatCurrency(currentNetWorth)} of ${formatCurrency(fireNumber)}`}
        />
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-fire-500 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Projection table */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold">Growth Projection</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium text-right">Contributions</th>
                <th className="px-4 py-3 font-medium text-right">Growth</th>
                <th className="px-4 py-3 font-medium text-right">Real Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projection.slice(0, 30).map((row) => (
                <tr
                  key={row.year}
                  className={
                    row.balance >= fireNumber
                      ? "bg-green-50 font-medium"
                      : ""
                  }
                >
                  <td className="px-4 py-2">{row.year}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(row.balance)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(row.contributions)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(row.growth)}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{formatCurrency(row.balanceReal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        This is a simplified simulator for illustration purposes. It assumes
        constant returns and contributions. Real markets are volatile. This is
        not financial advice.
      </p>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────

function InputSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: "currency" | "percent";
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-fire-600">
          {format === "currency" ? formatCurrency(value) : `${value}%`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-fire-500"
      />
    </div>
  );
}

function ResultCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-fire-600">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{sublabel}</p>
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
