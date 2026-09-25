import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">Comfinity</div>
              <div className="text-xs text-gray-400">Admin Scheduling</div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 text-sm font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>📅</span>
              <span>Bookings</span>
            </Link>
            <Link
              href="/admin/employees"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>👥</span>
              <span>Employees & Calendar</span>
            </Link>
            <Link
              href="/admin/blocked-time"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>⛔</span>
              <span>Blocked Time</span>
            </Link>
            <Link
              href="/admin/meeting-types"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>⚙️</span>
              <span>Meeting Types</span>
            </Link>
            <Link
              href="/admin/reviews"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>⭐</span>
              <span>Reviews</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>🔧</span>
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-gray-100 mt-6 md:mt-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-blue-600 hover:text-blue-700 font-medium py-1.5"
          >
            <span>View public booking site</span>
            <span>↗</span>
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
