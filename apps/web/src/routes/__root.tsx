import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top navigation — will be replaced with a proper nav component */}
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span>🔥</span>
            <span>Firewatch</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 [&.active]:font-semibold [&.active]:text-fire-600"
            >
              Home
            </Link>
            <Link
              to="/demo"
              className="text-gray-600 hover:text-gray-900 [&.active]:font-semibold [&.active]:text-fire-600"
            >
              Demo
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg bg-fire-500 px-4 py-2 text-sm font-medium text-white hover:bg-fire-600"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Page content renders here */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
