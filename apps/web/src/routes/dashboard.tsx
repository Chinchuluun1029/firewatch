import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession, signOut } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { fireProgress } from "@firewatch/fire-engine";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function DashboardPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const navigate = useNavigate();

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/accounts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json() as Promise<{ accounts: Array<{
        id: string;
        name: string;
        institution: string | null;
        category: string;
        taxTreatment: string;
        currentBalance: string;
      }> }>;
    },
    enabled: !!session?.user,
  });

  const { data: goalsData } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/goals`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json() as Promise<{ goals: Array<{
        id: string;
        name: string;
        type: string;
        targetNetWorth: string;
        targetAnnualSpending: string;
      }> }>;
    },
    enabled: !!session?.user,
  });

  if (sessionLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    navigate({ to: "/login" });
    return null;
  }

  const accounts = accountsData?.accounts ?? [];
  const goals = goalsData?.goals ?? [];

  const totalNetWorth = accounts.reduce(
    (sum, a) => sum + Number(a.currentBalance),
    0
  );

  const taxDeferred = accounts
    .filter((a) => a.taxTreatment === "tax_deferred")
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  const taxFree = accounts
    .filter((a) => a.taxTreatment === "tax_free")
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  const taxable = accounts
    .filter((a) => a.taxTreatment === "taxable" || a.taxTreatment === "tax_advantaged")
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome, {session.user.name} 👋</p>
        </div>
        <button
          onClick={() => signOut().then(() => navigate({ to: "/" }))}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Sign Out
        </button>
      </div>

      {/* Net Worth Summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Net Worth" value={fmt(totalNetWorth)} accent />
        <StatCard label="Tax-Deferred" value={fmt(taxDeferred)} sublabel="401(k), Traditional IRA" />
        <StatCard label="Tax-Free" value={fmt(taxFree)} sublabel="Roth IRA, Roth 401(k)" />
        <StatCard label="Taxable" value={fmt(taxable)} sublabel="Brokerage, HSA" />
      </div>

      {/* FIRE Progress */}
      {goals.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">FIRE Progress</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => {
              const progress = fireProgress(
                totalNetWorth,
                Number(goal.targetNetWorth)
              );
              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{goal.name}</h3>
                    <span className="rounded-full bg-fire-100 px-3 py-1 text-xs font-medium text-fire-700">
                      {goal.type}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {fmt(totalNetWorth)} of {fmt(Number(goal.targetNetWorth))}
                      </span>
                      <span className="font-semibold text-fire-600">
                        {progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-fire-500 transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Accounts</h2>
          <a
            href="/accounts"
            className="text-sm font-medium text-fire-600 hover:text-fire-500"
          >
            Manage Accounts →
          </a>
        </div>
        {accounts.length === 0 ? (
          <div className="mt-4 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No accounts yet.</p>
            <a
              href="/accounts"
              className="mt-2 inline-block text-sm font-medium text-fire-600 hover:text-fire-500"
            >
              Add your first account →
            </a>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Tax Treatment</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{account.name}</div>
                      {account.institution && (
                        <div className="text-xs text-gray-500">
                          {account.institution}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{account.category}</td>
                    <td className="px-4 py-3">
                      <TaxBadge treatment={account.taxTreatment} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {fmt(Number(account.currentBalance))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {goals.length === 0 && (
        <div className="mt-8 rounded-xl border border-fire-200 bg-fire-50 p-6">
          <h3 className="font-semibold text-fire-800">
            🎯 Set your first FIRE goal
          </h3>
          <p className="mt-1 text-sm text-fire-700">
            Define your target — LeanFIRE, ChubbyFIRE, FatFIRE, or a custom
            number. We'll track your progress automatically.
          </p>
          <a
            href="/goals"
            className="mt-3 inline-block rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
          >
            Create a FIRE Goal
          </a>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 shadow-sm ${
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
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}

function TaxBadge({ treatment }: { treatment: string }) {
  const styles: Record<string, string> = {
    tax_deferred: "bg-amber-100 text-amber-700",
    tax_free: "bg-green-100 text-green-700",
    taxable: "bg-gray-100 text-gray-700",
    tax_advantaged: "bg-blue-100 text-blue-700",
  };
  const labels: Record<string, string> = {
    tax_deferred: "Tax-Deferred",
    tax_free: "Tax-Free",
    taxable: "Taxable",
    tax_advantaged: "Tax-Advantaged",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[treatment] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[treatment] ?? treatment}
    </span>
  );
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
