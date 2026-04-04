import { createFileRoute, Link } from "@tanstack/react-router";
import {
  calculateFireNumber,
  calculateYearsToFire,
  fireProgress,
  projectMultiAccount,
  type ProjectionByYear,
} from "@firewatch/fire-engine";
import { FIRE_DEFAULTS, type FireType } from "@firewatch/types";
import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

// ─── Preset Scenarios ────────────────────────────────────────

interface Preset {
  label: string;
  description: string;
  age: number;
  income: number;
  annualExpenses: number;
  accounts: SimAccount[];
  fireType: Exclude<FireType, "custom">;
}

interface SimAccount {
  name: string;
  taxTreatment: string;
  balance: number;
  annualContribution: number;
  returnRate: number;
}

const PRESETS: Preset[] = [
  {
    label: "Early Career",
    description: "25 years old, $60k salary, just getting started",
    age: 25,
    income: 60_000,
    annualExpenses: 36_000,
    fireType: "leanfire",
    accounts: [
      { name: "401(k)", taxTreatment: "tax_deferred", balance: 12_000, annualContribution: 10_000, returnRate: 7 },
      { name: "Roth IRA", taxTreatment: "tax_free", balance: 5_000, annualContribution: 7_000, returnRate: 7 },
      { name: "Savings", taxTreatment: "taxable", balance: 8_000, annualContribution: 3_000, returnRate: 5 },
    ],
  },
  {
    label: "Mid Career",
    description: "35 years old, $120k salary, building momentum",
    age: 35,
    income: 120_000,
    annualExpenses: 65_000,
    fireType: "fire",
    accounts: [
      { name: "401(k)", taxTreatment: "tax_deferred", balance: 150_000, annualContribution: 23_000, returnRate: 7 },
      { name: "Roth IRA", taxTreatment: "tax_free", balance: 45_000, annualContribution: 7_000, returnRate: 7 },
      { name: "Brokerage", taxTreatment: "taxable", balance: 35_000, annualContribution: 15_000, returnRate: 6 },
      { name: "HSA", taxTreatment: "tax_advantaged", balance: 12_000, annualContribution: 4_150, returnRate: 7 },
    ],
  },
  {
    label: "High Earner",
    description: "30 years old, $200k salary, aggressive saver",
    age: 30,
    income: 200_000,
    annualExpenses: 80_000,
    fireType: "chubbyfire",
    accounts: [
      { name: "401(k)", taxTreatment: "tax_deferred", balance: 200_000, annualContribution: 23_000, returnRate: 7 },
      { name: "Mega Backdoor Roth", taxTreatment: "tax_free", balance: 80_000, annualContribution: 30_000, returnRate: 7 },
      { name: "Brokerage", taxTreatment: "taxable", balance: 120_000, annualContribution: 40_000, returnRate: 6 },
      { name: "HSA", taxTreatment: "tax_advantaged", balance: 20_000, annualContribution: 4_150, returnRate: 7 },
    ],
  },
  {
    label: "Starting Late",
    description: "45 years old, $90k salary, catching up",
    age: 45,
    income: 90_000,
    annualExpenses: 55_000,
    fireType: "fire",
    accounts: [
      { name: "401(k)", taxTreatment: "tax_deferred", balance: 80_000, annualContribution: 23_000, returnRate: 7 },
      { name: "IRA", taxTreatment: "tax_deferred", balance: 25_000, annualContribution: 7_000, returnRate: 7 },
      { name: "Brokerage", taxTreatment: "taxable", balance: 40_000, annualContribution: 5_000, returnRate: 6 },
    ],
  },
];

const TAX_COLORS: Record<string, string> = {
  tax_deferred: "#f59e0b",
  tax_free: "#10b981",
  taxable: "#6366f1",
  tax_advantaged: "#3b82f6",
};

const TAX_LABELS: Record<string, string> = {
  tax_deferred: "Tax-Deferred",
  tax_free: "Tax-Free",
  taxable: "Taxable",
  tax_advantaged: "Tax-Advantaged",
};

const FIRE_TYPES = Object.entries(FIRE_DEFAULTS).map(([key, val]) => ({
  value: key as Exclude<FireType, "custom">,
  ...val,
}));

// ─── Main Component ──────────────────────────────────────────

function DemoPage() {
  const [activePreset, setActivePreset] = useState(1); // Mid Career
  const [simAccounts, setSimAccounts] = useState<SimAccount[]>(PRESETS[1]!.accounts);
  const [annualExpenses, setAnnualExpenses] = useState(PRESETS[1]!.annualExpenses);
  const [fireType, setFireType] = useState<Exclude<FireType, "custom">>(PRESETS[1]!.fireType);
  const [swr, setSwr] = useState(4);
  const [years, setYears] = useState(30);

  function applyPreset(index: number) {
    const p = PRESETS[index]!;
    setActivePreset(index);
    setSimAccounts(p.accounts.map((a) => ({ ...a })));
    setAnnualExpenses(p.annualExpenses);
    setFireType(p.fireType);
  }

  const fireNumber = calculateFireNumber({ annualExpenses, safeWithdrawalRate: swr / 100 });
  const currentNetWorth = simAccounts.reduce((s, a) => s + a.balance, 0);
  const totalContributions = simAccounts.reduce((s, a) => s + a.annualContribution, 0);
  const progress = fireProgress(currentNetWorth, fireNumber);
  const savingsRate = totalContributions > 0 && annualExpenses > 0
    ? Math.round((totalContributions / (totalContributions + annualExpenses)) * 100)
    : 0;

  const avgReturn = currentNetWorth > 0
    ? simAccounts.reduce((s, a) => s + (a.returnRate / 100) * a.balance, 0) / currentNetWorth
    : 0.07;

  const ytf = calculateYearsToFire({
    fireNumber,
    currentNetWorth,
    annualSavings: totalContributions,
    annualReturnRate: avgReturn,
  });

  // Multi-account projection
  const projection = useMemo<ProjectionByYear[]>(() => {
    return projectMultiAccount({
      accounts: simAccounts.map((a) => ({
        name: a.name,
        taxTreatment: a.taxTreatment,
        startingBalance: a.balance,
        annualContribution: a.annualContribution,
        annualReturnRate: a.returnRate / 100,
      })),
      years,
      inflationRate: 0.03,
      fireTarget: fireNumber,
    });
  }, [simAccounts, years, fireNumber]);

  const chartData = projection.map((y) => ({
    year: `Y${y.year}`,
    ...y.byTaxTreatment,
    total: y.totalBalance,
    fireTarget: y.fireTarget,
  }));

  const taxKeys = useMemo(() => {
    if (!projection[0]) return [];
    return Object.keys(projection[0].byTaxTreatment);
  }, [projection]);

  const finalBalance = projection[projection.length - 1]?.totalBalance ?? 0;
  const fireYear = projection.find((y) => y.fireReached)?.year;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          🔥 FIRE Simulator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
          See how different scenarios affect your path to Financial Independence.
          No sign-up required — everything runs in your browser.
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Choose a Starting Point
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => applyPreset(i)}
              className={`rounded-xl border p-4 text-left transition-all ${
                activePreset === i
                  ? "border-fire-500 bg-fire-50 ring-2 ring-fire-500/20"
                  : "border-gray-200 bg-white hover:border-fire-300 hover:shadow-sm"
              }`}
            >
              <p className="font-semibold text-gray-900">{p.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FIRE Type Selector */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          FIRE Target
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {FIRE_TYPES.map((ft) => (
            <button
              key={ft.value}
              onClick={() => {
                setFireType(ft.value);
                if (ft.minSpending > 0) setAnnualExpenses(ft.minSpending);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                fireType === ft.value
                  ? "bg-fire-500 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-fire-300"
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ResultCard label="Net Worth" value={fmt(currentNetWorth)} />
        <ResultCard label="FIRE Number" value={fmt(fireNumber)} accent />
        <ResultCard
          label="Years to FIRE"
          value={ytf === Infinity ? "∞" : ytf.toFixed(1)}
          accent={ytf !== Infinity && ytf <= 15}
        />
        <ResultCard label="Progress" value={`${progress}%`} />
        <ResultCard label="Savings Rate" value={`${savingsRate}%`} />
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{fmt(currentNetWorth)}</span>
          <span>{fmt(fireNumber)}</span>
        </div>
        <div className="mt-1 h-5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fire-400 to-fire-600 transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Stacked Area Chart */}
      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Net Worth Projection — {years} Years
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={10}
              max={50}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-24 accent-fire-500"
            />
            <span className="text-sm font-medium text-fire-600 w-12">{years} yrs</span>
          </div>
        </div>
        {fireYear && (
          <p className="mt-1 text-sm text-green-600 font-medium">
            🎉 You hit FIRE in year {fireYear}! Final balance: {fmt(finalBalance)}
          </p>
        )}
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={Math.max(1, Math.floor(years / 10))} />
              <YAxis tickFormatter={(v: number) => fmtShort(v)} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [fmt(value), name]}
                labelFormatter={(l: string) => `Year ${l.replace("Y", "")}`}
              />
              <Legend />
              {taxKeys.map((tk) => (
                <Area
                  key={tk}
                  type="monotone"
                  dataKey={tk}
                  name={TAX_LABELS[tk] ?? tk}
                  stackId="1"
                  fill={TAX_COLORS[tk] ?? "#94a3b8"}
                  stroke={TAX_COLORS[tk] ?? "#94a3b8"}
                  fillOpacity={0.7}
                />
              ))}
              <ReferenceLine
                y={fireNumber}
                stroke="#ef4444"
                strokeDasharray="8 4"
                strokeWidth={2}
                label={{
                  value: `FIRE: ${fmt(fireNumber)}`,
                  position: "insideTopRight",
                  fill: "#ef4444",
                  fontSize: 12,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account Editor */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Customize Accounts</h2>
        <p className="mt-1 text-sm text-gray-500">
          Adjust balances, contributions, and returns to see how they impact your timeline.
        </p>

        <div className="mt-4 space-y-3">
          {simAccounts.map((acct, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: TAX_COLORS[acct.taxTreatment] ?? "#94a3b8" }}
                />
                <span className="text-sm font-medium truncate">{acct.name}</span>
                <span className="text-xs text-gray-400">
                  {TAX_LABELS[acct.taxTreatment]}
                </span>
              </div>

              <Field
                label="Balance"
                value={acct.balance}
                step={5000}
                onChange={(v) =>
                  setSimAccounts((prev) =>
                    prev.map((a, j) => (j === i ? { ...a, balance: v } : a))
                  )
                }
              />
              <Field
                label="$/yr"
                value={acct.annualContribution}
                step={1000}
                onChange={(v) =>
                  setSimAccounts((prev) =>
                    prev.map((a, j) => (j === i ? { ...a, annualContribution: v } : a))
                  )
                }
              />
              <Field
                label="Return %"
                value={acct.returnRate}
                step={0.5}
                min={-5}
                max={15}
                onChange={(v) =>
                  setSimAccounts((prev) =>
                    prev.map((a, j) => (j === i ? { ...a, returnRate: v } : a))
                  )
                }
                narrow
              />

              <button
                onClick={() => setSimAccounts((prev) => prev.filter((_, j) => j !== i))}
                className="text-gray-300 hover:text-red-500 text-lg"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() =>
              setSimAccounts((prev) => [
                ...prev,
                { name: "New Account", taxTreatment: "taxable", balance: 0, annualContribution: 0, returnRate: 6 },
              ])
            }
            className="text-sm font-medium text-fire-600 hover:text-fire-500"
          >
            + Add Account
          </button>
        </div>

        {/* Expenses + SWR */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Annual Expenses</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range"
                min={10_000}
                max={300_000}
                step={5_000}
                value={annualExpenses}
                onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                className="w-full accent-fire-500"
              />
              <span className="w-24 text-right text-sm font-semibold text-fire-600">
                {fmt(annualExpenses)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Safe Withdrawal Rate
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={6}
                step={0.5}
                value={swr}
                onChange={(e) => setSwr(Number(e.target.value))}
                className="w-full accent-fire-500"
              />
              <span className="w-16 text-right text-sm font-semibold text-fire-600">
                {swr}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-gradient-to-br from-fire-500 to-fire-700 px-8 py-10 text-center text-white shadow-lg">
        <h2 className="text-2xl font-bold">
          Ready to track your real FIRE journey?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-fire-100">
          Create a free account to track real accounts, set FIRE goals, manage
          budgets, and get AI-powered insights on your path to financial
          independence.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/login"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-fire-600 shadow-sm hover:bg-fire-50"
          >
            Create Free Account
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-fire-300 px-6 py-3 text-sm font-semibold text-white hover:bg-fire-600"
          >
            Learn More
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        This simulator is for illustration purposes only. It assumes constant
        returns and contributions. Real markets are volatile. This is not
        financial advice.
      </p>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────

function ResultCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-center shadow-sm ${
        accent ? "border-fire-200 bg-fire-50" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-fire-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  step,
  min = 0,
  max,
  onChange,
  narrow,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  narrow?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`rounded border border-gray-200 px-2 py-1 text-right text-sm focus:border-fire-500 focus:outline-none ${
          narrow ? "w-16" : "w-24"
        }`}
      />
    </div>
  );
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
