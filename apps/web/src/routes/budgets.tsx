import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/budgets")({
  component: BudgetsPage,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface BudgetSummary {
  id: string;
  name: string;
  month: string;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
  isDefault: boolean;
}

interface BudgetEntry {
  id: string;
  budgetId: string;
  categoryId: string;
  planned: string;
  actual: string;
  categoryName: string;
  categoryType: string;
  categoryColor: string | null;
}

function BudgetsPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  // ─── Queries ──────────────────────────────────────────────

  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/budgets`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json() as Promise<{ budgets: BudgetSummary[] }>;
    },
    enabled: !!session?.user,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["budget-categories"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/budgets/categories`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json() as Promise<{ categories: Category[] }>;
    },
    enabled: !!session?.user,
  });

  const activeBudgetId = selectedBudgetId ?? budgetsData?.budgets?.[budgetsData.budgets.length - 1]?.id;

  const { data: budgetDetail } = useQuery({
    queryKey: ["budget", activeBudgetId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/budgets/${activeBudgetId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json() as Promise<{
        budget: BudgetSummary;
        entries: BudgetEntry[];
      }>;
    },
    enabled: !!activeBudgetId,
  });

  // ─── Mutations ────────────────────────────────────────────

  const seedCategories = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/budgets/categories/seed`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to seed categories");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget-categories"] }),
  });

  const createBudget = useMutation({
    mutationFn: async (data: { name: string; month: string }) => {
      const res = await fetch(`${API_URL}/api/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create budget");
      }
      return res.json() as Promise<{ budget: BudgetSummary }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setSelectedBudgetId(data.budget.id);
      setShowNewBudget(false);
    },
  });

  const upsertEntry = useMutation({
    mutationFn: async (data: {
      budgetId: string;
      categoryId: string;
      planned: string;
      actual: string;
    }) => {
      const res = await fetch(`${API_URL}/api/budgets/${data.budgetId}/entries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          categoryId: data.categoryId,
          planned: data.planned,
          actual: data.actual,
        }),
      });
      if (!res.ok) throw new Error("Failed to save entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget", activeBudgetId] });
    },
  });

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; type: "income" | "expense" }) => {
      const res = await fetch(`${API_URL}/api/budgets/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
      setShowNewCategory(false);
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/budgets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setSelectedBudgetId(null);
    },
  });

  // ─── Guards ───────────────────────────────────────────────

  if (isPending) return <Loading />;
  if (!session?.user) {
    navigate({ to: "/login" });
    return null;
  }

  const allBudgets = budgetsData?.budgets ?? [];
  const categories = categoriesData?.categories ?? [];
  const entries = budgetDetail?.entries ?? [];
  const hasCategories = categories.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">💰 Budgets</h1>
        <div className="flex gap-2">
          {!hasCategories && (
            <button
              onClick={() => seedCategories.mutate()}
              disabled={seedCategories.isPending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {seedCategories.isPending ? "Setting up..." : "Set Up Default Categories"}
            </button>
          )}
          <button
            onClick={() => setShowNewBudget(!showNewBudget)}
            className="rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
          >
            {showNewBudget ? "Cancel" : "+ New Month"}
          </button>
        </div>
      </div>

      {/* New budget form */}
      {showNewBudget && (
        <NewBudgetForm
          currentMonth={currentMonth}
          onSubmit={(data) => createBudget.mutate(data)}
          isLoading={createBudget.isPending}
          error={createBudget.error?.message ?? null}
        />
      )}

      {/* Month selector tabs */}
      {allBudgets.length > 0 && (
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {allBudgets.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBudgetId(b.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeBudgetId === b.id
                  ? "bg-fire-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-fire-300"
              }`}
            >
              {formatMonth(b.month)}
            </button>
          ))}
        </div>
      )}

      {/* Budget detail */}
      {budgetsLoading ? (
        <Loading />
      ) : allBudgets.length === 0 ? (
        <EmptyState
          hasCategories={hasCategories}
          onSeed={() => seedCategories.mutate()}
          onNewBudget={() => setShowNewBudget(true)}
        />
      ) : activeBudgetId ? (
        <BudgetDetail
          budgetId={activeBudgetId}
          categories={categories}
          entries={entries}
          onUpsertEntry={(data) => upsertEntry.mutate(data)}
          onDeleteBudget={() => {
            if (confirm("Delete this budget?")) deleteBudget.mutate(activeBudgetId);
          }}
          showNewCategory={showNewCategory}
          onToggleNewCategory={() => setShowNewCategory(!showNewCategory)}
          onCreateCategory={(data) => createCategory.mutate(data)}
          isSaving={upsertEntry.isPending}
        />
      ) : null}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function BudgetDetail({
  budgetId,
  categories,
  entries,
  onUpsertEntry,
  onDeleteBudget,
  showNewCategory,
  onToggleNewCategory,
  onCreateCategory,
  isSaving,
}: {
  budgetId: string;
  categories: Category[];
  entries: BudgetEntry[];
  onUpsertEntry: (data: {
    budgetId: string;
    categoryId: string;
    planned: string;
    actual: string;
  }) => void;
  onDeleteBudget: () => void;
  showNewCategory: boolean;
  onToggleNewCategory: () => void;
  onCreateCategory: (data: { name: string; type: "income" | "expense" }) => void;
  isSaving: boolean;
}) {
  const entryMap = useMemo(() => {
    const map = new Map<string, BudgetEntry>();
    entries.forEach((e) => map.set(e.categoryId, e));
    return map;
  }, [entries]);

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const totalPlannedIncome = incomeCategories.reduce(
    (sum, c) => sum + Number(entryMap.get(c.id)?.planned ?? 0),
    0
  );
  const totalActualIncome = incomeCategories.reduce(
    (sum, c) => sum + Number(entryMap.get(c.id)?.actual ?? 0),
    0
  );
  const totalPlannedExpenses = expenseCategories.reduce(
    (sum, c) => sum + Number(entryMap.get(c.id)?.planned ?? 0),
    0
  );
  const totalActualExpenses = expenseCategories.reduce(
    (sum, c) => sum + Number(entryMap.get(c.id)?.actual ?? 0),
    0
  );

  const plannedSavings = totalPlannedIncome - totalPlannedExpenses;
  const actualSavings = totalActualIncome - totalActualExpenses;
  const savingsRate =
    totalActualIncome > 0
      ? Math.round((actualSavings / totalActualIncome) * 100)
      : 0;

  return (
    <div className="mt-6 space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Income"
          planned={totalPlannedIncome}
          actual={totalActualIncome}
          color="green"
        />
        <SummaryCard
          label="Expenses"
          planned={totalPlannedExpenses}
          actual={totalActualExpenses}
          color="red"
        />
        <SummaryCard
          label="Savings"
          planned={plannedSavings}
          actual={actualSavings}
          color="blue"
        />
        <div className="rounded-xl border border-fire-200 bg-fire-50 p-4">
          <p className="text-sm text-gray-500">Savings Rate</p>
          <p className="mt-1 text-2xl font-bold text-fire-600">{savingsRate}%</p>
          <p className="text-xs text-gray-400">of actual income</p>
        </div>
      </div>

      {/* Income section */}
      <CategorySection
        title="Income"
        categories={incomeCategories}
        entryMap={entryMap}
        budgetId={budgetId}
        onSave={onUpsertEntry}
        isSaving={isSaving}
        accent="green"
      />

      {/* Expenses section */}
      <CategorySection
        title="Expenses"
        categories={expenseCategories}
        entryMap={entryMap}
        budgetId={budgetId}
        onSave={onUpsertEntry}
        isSaving={isSaving}
        accent="red"
      />

      {/* Add category + delete budget */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <div>
          <button
            onClick={onToggleNewCategory}
            className="text-sm font-medium text-fire-600 hover:text-fire-500"
          >
            {showNewCategory ? "Cancel" : "+ Add Custom Category"}
          </button>
          {showNewCategory && (
            <NewCategoryForm onSubmit={onCreateCategory} />
          )}
        </div>
        <button
          onClick={onDeleteBudget}
          className="text-sm text-gray-400 hover:text-red-500"
        >
          Delete this budget
        </button>
      </div>
    </div>
  );
}

function CategorySection({
  title,
  categories,
  entryMap,
  budgetId,
  onSave,
  isSaving,
  accent,
}: {
  title: string;
  categories: Category[];
  entryMap: Map<string, BudgetEntry>;
  budgetId: string;
  onSave: (data: {
    budgetId: string;
    categoryId: string;
    planned: string;
    actual: string;
  }) => void;
  isSaving: boolean;
  accent: "green" | "red";
}) {
  if (categories.length === 0) return null;

  return (
    <div>
      <h2
        className={`text-lg font-semibold ${
          accent === "green" ? "text-green-700" : "text-red-700"
        }`}
      >
        {title}
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Planned</th>
              <th className="px-4 py-3 text-right font-medium">Actual</th>
              <th className="px-4 py-3 text-right font-medium">Diff</th>
              <th className="px-4 py-3 text-center font-medium w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                entry={entryMap.get(cat.id)}
                budgetId={budgetId}
                onSave={onSave}
                isSaving={isSaving}
                type={accent === "green" ? "income" : "expense"}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  entry,
  budgetId,
  onSave,
  isSaving,
  type,
}: {
  category: Category;
  entry: BudgetEntry | undefined;
  budgetId: string;
  onSave: (data: {
    budgetId: string;
    categoryId: string;
    planned: string;
    actual: string;
  }) => void;
  isSaving: boolean;
  type: "income" | "expense";
}) {
  const [planned, setPlanned] = useState(entry?.planned ?? "0");
  const [actual, setActual] = useState(entry?.actual ?? "0");
  const [dirty, setDirty] = useState(false);

  const diff = Number(actual) - Number(planned);
  const isOver = type === "expense" ? diff > 0 : diff < 0;

  return (
    <tr>
      <td className="px-4 py-2.5 font-medium">{category.name}</td>
      <td className="px-4 py-2.5 text-right">
        <input
          type="number"
          min="0"
          step="0.01"
          value={planned}
          onChange={(e) => {
            setPlanned(e.target.value);
            setDirty(true);
          }}
          className="w-28 rounded border border-gray-200 px-2 py-1 text-right text-sm focus:border-fire-500 focus:outline-none"
        />
      </td>
      <td className="px-4 py-2.5 text-right">
        <input
          type="number"
          min="0"
          step="0.01"
          value={actual}
          onChange={(e) => {
            setActual(e.target.value);
            setDirty(true);
          }}
          className="w-28 rounded border border-gray-200 px-2 py-1 text-right text-sm focus:border-fire-500 focus:outline-none"
        />
      </td>
      <td
        className={`px-4 py-2.5 text-right text-sm font-medium ${
          isOver ? "text-red-600" : diff === 0 ? "text-gray-400" : "text-green-600"
        }`}
      >
        {diff > 0 ? "+" : ""}
        {fmt(diff)}
      </td>
      <td className="px-4 py-2.5 text-center">
        {dirty && (
          <button
            onClick={() => {
              onSave({
                budgetId,
                categoryId: category.id,
                planned: Number(planned).toFixed(2),
                actual: Number(actual).toFixed(2),
              });
              setDirty(false);
            }}
            disabled={isSaving}
            className="rounded bg-fire-500 px-3 py-1 text-xs font-medium text-white hover:bg-fire-600 disabled:opacity-50"
          >
            Save
          </button>
        )}
      </td>
    </tr>
  );
}

function SummaryCard({
  label,
  planned,
  actual,
  color,
}: {
  label: string;
  planned: number;
  actual: number;
  color: "green" | "red" | "blue";
}) {
  const colors = {
    green: "border-green-200 bg-green-50 text-green-700",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{fmt(actual)}</p>
      <p className="text-xs opacity-60">
        Planned: {fmt(planned)}
      </p>
    </div>
  );
}

function NewBudgetForm({
  currentMonth,
  onSubmit,
  isLoading,
  error,
}: {
  currentMonth: string;
  onSubmit: (data: { name: string; month: string }) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [month, setMonth] = useState(currentMonth);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const label = formatMonth(month);
        onSubmit({ name: label, month });
      }}
      className="mt-4 flex items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-fire-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-fire-500 px-6 py-2 text-sm font-medium text-white hover:bg-fire-600 disabled:opacity-50"
      >
        {isLoading ? "Creating..." : "Create Budget"}
      </button>
    </form>
  );
}

function NewCategoryForm({
  onSubmit,
}: {
  onSubmit: (data: { name: string; type: "income" | "expense" }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, type });
        setName("");
      }}
      className="mt-2 flex items-end gap-3"
    >
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-fire-500 focus:outline-none"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "income" | "expense")}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <button
        type="submit"
        className="rounded-lg bg-fire-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-fire-600"
      >
        Add
      </button>
    </form>
  );
}

function EmptyState({
  hasCategories,
  onSeed,
  onNewBudget,
}: {
  hasCategories: boolean;
  onSeed: () => void;
  onNewBudget: () => void;
}) {
  return (
    <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
      <p className="text-lg text-gray-500">No budgets yet</p>
      <p className="mt-1 text-sm text-gray-400">
        {hasCategories
          ? "Create your first monthly budget to start tracking income and expenses."
          : "First, set up your budget categories, then create a monthly budget."}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        {!hasCategories && (
          <button
            onClick={onSeed}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Set Up Categories
          </button>
        )}
        <button
          onClick={onNewBudget}
          className="rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
        >
          Create First Budget
        </button>
      </div>
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

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
