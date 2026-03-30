import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FIRE_DEFAULTS } from "@firewatch/types";
import { calculateFireNumber, fireProgress } from "@firewatch/fire-engine";

export const Route = createFileRoute("/goals")({
  component: GoalsPage,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const FIRE_TYPES = [
  { value: "leanfire", label: "Lean FIRE", desc: "Minimal lifestyle, < $40k/year" },
  { value: "fire", label: "FIRE", desc: "Standard, $40k–$100k/year" },
  { value: "chubbyfire", label: "Chubby FIRE", desc: "Comfortable, $100k–$200k/year" },
  { value: "fatfire", label: "Fat FIRE", desc: "Luxurious, $200k–$500k/year" },
  { value: "baristafire", label: "Barista FIRE", desc: "Part-time work covers gap" },
  { value: "coastfire", label: "Coast FIRE", desc: "Compounding alone reaches goal" },
  { value: "custom", label: "Custom", desc: "Set your own target" },
] as const;

interface Goal {
  id: string;
  name: string;
  type: string;
  targetNetWorth: string;
  targetAnnualSpending: string;
  safeWithdrawalRate: string;
  targetDate: string | null;
}

function GoalsPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/goals`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ goals: Goal[] }>;
    },
    enabled: !!session?.user,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/accounts`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ accounts: Array<{ currentBalance: string }> }>;
    },
    enabled: !!session?.user,
  });

  const createMutation = useMutation({
    mutationFn: async (goal: {
      name: string;
      type: string;
      targetNetWorth: string;
      targetAnnualSpending: string;
      safeWithdrawalRate: string;
    }) => {
      const res = await fetch(`${API_URL}/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(goal),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/goals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  if (isPending) return <Loading />;
  if (!session?.user) {
    navigate({ to: "/login" });
    return null;
  }

  const goals = goalsData?.goals ?? [];
  const totalNetWorth = (accountsData?.accounts ?? []).reduce(
    (sum, a) => sum + Number(a.currentBalance),
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🎯 FIRE Goals</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
        >
          {showForm ? "Cancel" : "+ New Goal"}
        </button>
      </div>

      {showForm && (
        <GoalForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {isLoading ? (
        <Loading />
      ) : goals.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg text-gray-500">No FIRE goals yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Pick a FIRE type and set your target. Track multiple goals simultaneously.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {goals.map((goal) => {
            const progress = fireProgress(totalNetWorth, Number(goal.targetNetWorth));
            return (
              <div
                key={goal.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{goal.name}</h3>
                      <span className="rounded-full bg-fire-100 px-3 py-0.5 text-xs font-medium text-fire-700">
                        {goal.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Target: {fmt(Number(goal.targetNetWorth))} ·
                      Spending: {fmt(Number(goal.targetAnnualSpending))}/yr ·
                      SWR: {(Number(goal.safeWithdrawalRate) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${goal.name}"?`)) {
                        deleteMutation.mutate(goal.id);
                      }
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {fmt(totalNetWorth)} of {fmt(Number(goal.targetNetWorth))}
                    </span>
                    <span className="font-bold text-fire-600">{progress}%</span>
                  </div>
                  <div className="mt-2 h-4 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fire-400 to-fire-600 transition-all duration-700"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: {
    name: string;
    type: string;
    targetNetWorth: string;
    targetAnnualSpending: string;
    safeWithdrawalRate: string;
  }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("fire");
  const [spending, setSpending] = useState("50000");
  const [swr, setSwr] = useState("4.0");

  const fireNumber = calculateFireNumber({
    annualExpenses: Number(spending),
    safeWithdrawalRate: Number(swr) / 100,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name: name || FIRE_TYPES.find((t) => t.value === type)?.label || "My Goal",
          type,
          targetNetWorth: fireNumber.toFixed(2),
          targetAnnualSpending: Number(spending).toFixed(2),
          safeWithdrawalRate: (Number(swr) / 100).toFixed(4),
        });
      }}
      className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Create a FIRE Goal</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            FIRE Type
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {FIRE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setType(t.value);
                  if (!name) setName(t.label);
                  const defaults = FIRE_DEFAULTS[t.value as keyof typeof FIRE_DEFAULTS];
                  if (defaults?.minSpending) {
                    setSpending(String(defaults.minSpending));
                  }
                }}
                className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                  type === t.value
                    ? "border-fire-500 bg-fire-50 ring-1 ring-fire-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">{t.label}</div>
                <div className="mt-0.5 text-xs text-gray-500">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Goal Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={FIRE_TYPES.find((t) => t.value === type)?.label}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Annual Spending Target
          </label>
          <input
            type="number"
            required
            min="1000"
            value={spending}
            onChange={(e) => setSpending(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Safe Withdrawal Rate (%)
          </label>
          <input
            type="number"
            required
            min="1"
            max="10"
            step="0.1"
            value={swr}
            onChange={(e) => setSwr(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
          />
        </div>

        <div className="flex items-end">
          <div className="rounded-lg bg-fire-50 p-3">
            <p className="text-sm text-gray-600">FIRE Number (auto-calculated)</p>
            <p className="text-2xl font-bold text-fire-600">{fmt(fireNumber)}</p>
            <p className="text-xs text-gray-500">
              {fmt(Number(spending))} ÷ {swr}% = {fmt(fireNumber)}
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 rounded-lg bg-fire-500 px-6 py-2 text-sm font-medium text-white hover:bg-fire-600 disabled:opacity-50"
      >
        {isLoading ? "Creating..." : "Create Goal"}
      </button>
    </form>
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
