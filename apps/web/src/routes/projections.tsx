import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
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

export const Route = createFileRoute("/projections")({
  component: ProjectionsPage,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface Account {
  id: string;
  name: string;
  taxTreatment: string;
  currentBalance: string;
}

interface ContributionInput {
  accountId: string;
  annualContribution: number;
  annualReturnRate: number;
}

interface ProjectionYear {
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

interface ProjectionResponse {
  projection: ProjectionYear[];
  summary: {
    currentNetWorth: number;
    fireTarget: number | null;
    yearsToFire: number | null;
    totalAnnualContributions: number;
    accountCount: number;
    goalName: string | null;
  };
}

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

const DEFAULT_RATES: Record<string, number> = {
  tax_deferred: 7,
  tax_free: 7,
  taxable: 6,
  tax_advantaged: 7,
};

function ProjectionsPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  const [years, setYears] = useState(30);
  const [inflation, setInflation] = useState(3);
  const [contributions, setContributions] = useState<
    Record<string, { contribution: number; returnRate: number }>
  >({});
  const [viewMode, setViewMode] = useState<"tax" | "account">("tax");
  const [showReal, setShowReal] = useState(false);

  // Fetch accounts
  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/accounts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json() as Promise<{ accounts: Account[] }>;
    },
    enabled: !!session?.user,
  });

  const accounts = accountsData?.accounts ?? [];

  // Build contribution inputs
  const contributionInputs: ContributionInput[] = useMemo(
    () =>
      accounts.map((a) => ({
        accountId: a.id,
        annualContribution: contributions[a.id]?.contribution ?? 0,
        annualReturnRate:
          (contributions[a.id]?.returnRate ?? DEFAULT_RATES[a.taxTreatment] ?? 7) / 100,
      })),
    [accounts, contributions]
  );

  // Run projection
  const projectionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/projections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          years,
          inflationRate: inflation / 100,
          contributions: contributionInputs,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate projection");
      return res.json() as Promise<ProjectionResponse>;
    },
  });

  const projection = projectionMutation.data;

  // Chart data
  const chartData = useMemo(() => {
    if (!projection) return [];
    return projection.projection.map((y) => ({
      year: `Y${y.year}`,
      ...y.byTaxTreatment,
      total: showReal ? y.totalBalanceReal : y.totalBalance,
      contributions: y.totalContributions,
      growth: y.totalGrowth,
      fireTarget: y.fireTarget,
      ...Object.fromEntries(
        Object.entries(y.byAccount).map(([k, v]) => [`acct_${k}`, v])
      ),
    }));
  }, [projection, showReal]);

  // Get unique tax treatments and account names in the data
  const taxTreatments = useMemo(() => {
    if (!projection?.projection[0]) return [];
    return Object.keys(projection.projection[0].byTaxTreatment);
  }, [projection]);

  const accountNames = useMemo(() => {
    if (!projection?.projection[0]) return [];
    return Object.keys(projection.projection[0].byAccount);
  }, [projection]);

  if (isPending) return <Loading />;
  if (!session?.user) {
    navigate({ to: "/login" });
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">📈 Net Worth Projections</h1>
      <p className="mt-1 text-gray-600">
        See how your wealth grows over time across different account types.
      </p>

      {accounts.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg text-gray-500">No accounts to project</p>
          <p className="mt-1 text-sm text-gray-400">
            Add some financial accounts first, then come back to see projections.
          </p>
          <a
            href="/accounts"
            className="mt-4 inline-block rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
          >
            Add Accounts
          </a>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Assumptions</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Projection Period
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={50}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full accent-fire-500"
                  />
                  <span className="w-16 text-right text-sm font-semibold text-fire-600">
                    {years} yrs
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Inflation Rate
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={0.5}
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-full accent-fire-500"
                  />
                  <span className="w-16 text-right text-sm font-semibold text-fire-600">
                    {inflation}%
                  </span>
                </div>
              </div>
            </div>

            {/* Per-account contribution & return rate */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700">
                Annual Contributions & Expected Returns
              </h3>
              <div className="mt-2 space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {account.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fmt(Number(account.currentBalance))} ·{" "}
                        {TAX_LABELS[account.taxTreatment] ?? account.taxTreatment}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">$/yr</label>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={contributions[account.id]?.contribution ?? 0}
                        onChange={(e) =>
                          setContributions((prev) => ({
                            ...prev,
                            [account.id]: {
                              contribution: Number(e.target.value),
                              returnRate:
                                prev[account.id]?.returnRate ??
                                DEFAULT_RATES[account.taxTreatment] ??
                                7,
                            },
                          }))
                        }
                        className="w-28 rounded border border-gray-200 px-2 py-1 text-right text-sm focus:border-fire-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Return %</label>
                      <input
                        type="number"
                        min={-10}
                        max={20}
                        step={0.5}
                        value={
                          contributions[account.id]?.returnRate ??
                          DEFAULT_RATES[account.taxTreatment] ??
                          7
                        }
                        onChange={(e) =>
                          setContributions((prev) => ({
                            ...prev,
                            [account.id]: {
                              contribution:
                                prev[account.id]?.contribution ?? 0,
                              returnRate: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-right text-sm focus:border-fire-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => projectionMutation.mutate()}
              disabled={projectionMutation.isPending}
              className="mt-6 rounded-lg bg-fire-500 px-8 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-fire-600 disabled:opacity-50"
            >
              {projectionMutation.isPending
                ? "Calculating..."
                : "Run Projection"}
            </button>
          </div>

          {/* Results */}
          {projection && (
            <>
              {/* Summary */}
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <SummaryCard
                  label="Current Net Worth"
                  value={fmt(projection.summary.currentNetWorth)}
                />
                <SummaryCard
                  label={`Net Worth in ${years} Years`}
                  value={fmt(
                    projection.projection[projection.projection.length - 1]
                      ?.totalBalance ?? 0
                  )}
                  accent
                />
                {projection.summary.fireTarget && (
                  <SummaryCard
                    label={`FIRE Target${projection.summary.goalName ? ` (${projection.summary.goalName})` : ""}`}
                    value={fmt(projection.summary.fireTarget)}
                  />
                )}
                {projection.summary.yearsToFire !== null && (
                  <SummaryCard
                    label="Years to FIRE"
                    value={`${projection.summary.yearsToFire}`}
                    accent
                  />
                )}
              </div>

              {/* Chart controls */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex rounded-lg border border-gray-200 bg-white">
                  <button
                    onClick={() => setViewMode("tax")}
                    className={`px-4 py-1.5 text-sm font-medium ${
                      viewMode === "tax"
                        ? "bg-fire-500 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    } rounded-l-lg`}
                  >
                    By Tax Type
                  </button>
                  <button
                    onClick={() => setViewMode("account")}
                    className={`px-4 py-1.5 text-sm font-medium ${
                      viewMode === "account"
                        ? "bg-fire-500 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    } rounded-r-lg`}
                  >
                    By Account
                  </button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showReal}
                    onChange={(e) => setShowReal(e.target.checked)}
                    className="accent-fire-500"
                  />
                  Inflation-adjusted
                </label>
              </div>

              {/* Stacked Area Chart */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12 }}
                      interval={Math.floor(years / 10)}
                    />
                    <YAxis
                      tickFormatter={(v: number) => fmtShort(v)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        fmt(value),
                        name,
                      ]}
                      labelFormatter={(label: string) => `Year ${label.replace("Y", "")}`}
                    />
                    <Legend />

                    {viewMode === "tax"
                      ? taxTreatments.map((tt) => (
                          <Area
                            key={tt}
                            type="monotone"
                            dataKey={tt}
                            name={TAX_LABELS[tt] ?? tt}
                            stackId="1"
                            fill={TAX_COLORS[tt] ?? "#94a3b8"}
                            stroke={TAX_COLORS[tt] ?? "#94a3b8"}
                            fillOpacity={0.7}
                          />
                        ))
                      : accountNames.map((name, i) => {
                          const colors = [
                            "#f59e0b",
                            "#10b981",
                            "#6366f1",
                            "#3b82f6",
                            "#ec4899",
                            "#8b5cf6",
                            "#14b8a6",
                            "#f97316",
                          ];
                          return (
                            <Area
                              key={name}
                              type="monotone"
                              dataKey={`acct_${name}`}
                              name={name}
                              stackId="1"
                              fill={colors[i % colors.length]}
                              stroke={colors[i % colors.length]}
                              fillOpacity={0.7}
                            />
                          );
                        })}

                    {projection.summary.fireTarget && (
                      <ReferenceLine
                        y={projection.summary.fireTarget}
                        stroke="#ef4444"
                        strokeDasharray="8 4"
                        strokeWidth={2}
                        label={{
                          value: `FIRE Target: ${fmt(projection.summary.fireTarget)}`,
                          position: "insideTopRight",
                          fill: "#ef4444",
                          fontSize: 12,
                        }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Contributions vs Growth chart */}
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  Contributions vs Investment Growth
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12 }}
                      interval={Math.floor(years / 10)}
                    />
                    <YAxis
                      tickFormatter={(v: number) => fmtShort(v)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        fmt(value),
                        name,
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="contributions"
                      name="Your Contributions"
                      stackId="1"
                      fill="#93c5fd"
                      stroke="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="growth"
                      name="Investment Growth"
                      stackId="1"
                      fill="#86efac"
                      stroke="#22c55e"
                      fillOpacity={0.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-4 text-xs text-gray-400">
                Projections assume constant returns and contributions. Real
                markets are volatile. This is not financial advice.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
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
      className={`rounded-xl border p-4 shadow-sm ${
        accent
          ? "border-fire-200 bg-fire-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent ? "text-fire-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-gray-500">Loading...</div>
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
