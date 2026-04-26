import { NavLink, Outlet } from "react-router-dom";
import { useConfig } from "../ConfigContext";

export default function Layout() {
  const { devMode } = useConfig();
  const navItems = [
    { to: "/calendar", label: "Calendar", icon: "📅" },
    { to: "/rotations", label: "Rotations", icon: "🔄" },
    { to: "/members", label: "Members", icon: "👥" },
    ...(devMode ? [{ to: "/gmail" as const, label: "Gmail", icon: "✉️" }] : []),
  ];
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗓️</span>
            <span className="text-xl font-bold tracking-tight">
              Rotation Calendar
            </span>
          </div>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-brand-100 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-gray-400 py-3 border-t">
        Rotation Calendar — powered by React + Node.js + PostgreSQL
      </footer>
    </div>
  );
}
