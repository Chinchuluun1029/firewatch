import {
  createRootRoute,
  Link,
  Outlet,
  useRouter,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: ErrorFallback,
});

const NAV_LINKS = [
  { to: "/demo" as const, label: "Demo" },
  { to: "/dashboard" as const, label: "Dashboard" },
  { to: "/accounts" as const, label: "Accounts" },
  { to: "/goals" as const, label: "Goals" },
  { to: "/budgets" as const, label: "Budgets" },
  { to: "/projections" as const, label: "Projections" },
  { to: "/insights" as const, label: "Insights" },
];

function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Close menu on navigation
  useEffect(() => {
    const unsub = router.subscribe("onLoad", () => setMenuOpen(false));
    return unsub;
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span>🔥</span>
            <span>Firewatch</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-5 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-gray-900 [&.active]:font-semibold [&.active]:text-fire-600"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/login"
              className="rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&.active]:bg-fire-50 [&.active]:font-semibold [&.active]:text-fire-600"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/login"
                className="mt-2 rounded-lg bg-fire-500 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-fire-600"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>🔥</span>
              <span>Firewatch — Track your path to Financial Independence</span>
            </div>
            <p className="text-xs text-gray-400">
              Not financial advice. Consult a qualified advisor.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-fire-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-fire-600"
      >
        Go Home
      </Link>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl">⚠️</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        Something went wrong
      </h1>
      <p className="mt-2 text-gray-600">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-lg bg-fire-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-fire-600"
      >
        Reload Page
      </button>
    </div>
  );
}
