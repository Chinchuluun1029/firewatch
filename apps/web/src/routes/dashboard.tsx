import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Your financial independence command center. Coming in Milestone 2.
      </p>

      {/* Placeholder grid for future dashboard widgets */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Net Worth Overview",
          "FIRE Progress",
          "Account Balances",
          "Monthly Budget",
          "Savings Rate",
          "Recent Transactions",
        ].map((widget) => (
          <div
            key={widget}
            className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400"
          >
            {widget}
          </div>
        ))}
      </div>
    </div>
  );
}
