import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/accounts")({
  component: AccountsPage,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const CATEGORIES = [
  { value: "retirement", label: "Retirement" },
  { value: "brokerage", label: "Brokerage" },
  { value: "savings", label: "Savings" },
  { value: "hsa", label: "HSA" },
  { value: "education", label: "Education (529)" },
  { value: "real_estate", label: "Real Estate" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Other" },
] as const;

const TAX_TREATMENTS = [
  { value: "tax_deferred", label: "Tax-Deferred", desc: "401(k), Traditional IRA" },
  { value: "tax_free", label: "Tax-Free", desc: "Roth IRA, Roth 401(k)" },
  { value: "taxable", label: "Taxable", desc: "Brokerage accounts" },
  { value: "tax_advantaged", label: "Tax-Advantaged", desc: "HSA, 529" },
] as const;

interface Account {
  id: string;
  name: string;
  institution: string | null;
  category: string;
  taxTreatment: string;
  currentBalance: string;
}

function AccountsPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/accounts`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ accounts: Account[] }>;
    },
    enabled: !!session?.user,
  });

  const createMutation = useMutation({
    mutationFn: async (account: {
      name: string;
      institution: string;
      category: string;
      taxTreatment: string;
      currentBalance: string;
    }) => {
      const res = await fetch(`${API_URL}/api/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(account),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/accounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  if (isPending) return <Loading />;
  if (!session?.user) {
    navigate({ to: "/login" });
    return null;
  }

  const accounts = data?.accounts ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
        >
          {showForm ? "Cancel" : "+ Add Account"}
        </button>
      </div>

      {showForm && (
        <AccountForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.message ?? null}
        />
      )}

      {isLoading ? (
        <Loading />
      ) : accounts.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg text-gray-500">No accounts yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Add your 401(k), IRA, brokerage, or any financial account to start tracking.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div>
                <h3 className="font-semibold">{account.name}</h3>
                <p className="text-sm text-gray-500">
                  {account.institution ?? "No institution"} ·{" "}
                  <span className="capitalize">{account.category.replace("_", " ")}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(account.currentBalance))}
                  </p>
                  <TaxBadge treatment={account.taxTreatment} />
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${account.name}"?`)) {
                      deleteMutation.mutate(account.id);
                    }
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Delete account"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountForm({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (data: {
    name: string;
    institution: string;
    category: string;
    taxTreatment: string;
    currentBalance: string;
  }) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [category, setCategory] = useState("retirement");
  const [taxTreatment, setTaxTreatment] = useState("tax_deferred");
  const [balance, setBalance] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          institution,
          category,
          taxTreatment,
          currentBalance: parseFloat(balance).toFixed(2),
        });
      }}
      className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Add New Account</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Fidelity 401(k)"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Institution
          </label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g., Fidelity, Vanguard"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tax Treatment *
          </label>
          <select
            value={taxTreatment}
            onChange={(e) => setTaxTreatment(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
          >
            {TAX_TREATMENTS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} — {t.desc}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Current Balance *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-1 focus:ring-fire-500"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 rounded-lg bg-fire-500 px-6 py-2 text-sm font-medium text-white hover:bg-fire-600 disabled:opacity-50"
      >
        {isLoading ? "Adding..." : "Add Account"}
      </button>
    </form>
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
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[treatment] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[treatment] ?? treatment}
    </span>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}
