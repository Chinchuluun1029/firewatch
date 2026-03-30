import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Track your path to{" "}
        <span className="text-fire-500">Financial Independence</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
        Firewatch helps you track FIRE progress, project net worth growth across
        account types, manage budgets, and get AI-powered insights on your
        financial journey.
      </p>
      <div className="mt-10 flex items-center justify-center gap-4">
        <Link
          to="/demo"
          className="rounded-lg bg-fire-500 px-6 py-3 text-lg font-medium text-white shadow-sm hover:bg-fire-600"
        >
          Try the Demo
        </Link>
        <Link
          to="/dashboard"
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-lg font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Feature highlights */}
      <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    icon: "🎯",
    title: "FIRE Goals",
    description: "Track LeanFIRE, ChubbyFIRE, FatFIRE, BaristaFIRE, or set custom targets.",
  },
  {
    icon: "📈",
    title: "Net Worth Projections",
    description: "See how your money grows across tax-deferred, tax-free, and brokerage accounts.",
  },
  {
    icon: "💰",
    title: "Budgeting",
    description: "Track income and expenses with smart categories and monthly breakdowns.",
  },
  {
    icon: "🤖",
    title: "AI Insights",
    description: "Get personalized insights on your spending patterns and saving habits.",
  },
  {
    icon: "📊",
    title: "Account Tracking",
    description: "Manage 401(k), Roth IRA, HSA, brokerage, and more in one place.",
  },
  {
    icon: "🏔️",
    title: "Milestones",
    description: "Set checkpoints on your FIRE journey and celebrate progress along the way.",
  },
];
