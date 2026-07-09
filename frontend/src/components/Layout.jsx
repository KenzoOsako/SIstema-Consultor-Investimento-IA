import React from "react";
import { NavLink } from "react-router-dom";
import { LineChart, Bot, Home, TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/dashboard", label: "Análise de Ativos", icon: LineChart },
  { to: "/consultor", label: "Consultor IA", icon: Bot },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-[#0f1116] text-foreground">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/5 bg-[#0c0e13]/80 backdrop-blur-xl">
        <div className="px-6 py-7 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 grid place-items-center neon-glow">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="leading-tight">
            <p className="font-bold tracking-tight">Radar B3</p>
            <p className="text-xs text-muted-foreground">Investimentos</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-400/10 text-emerald-400 neon-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Usuário + Logout */}
        <div className="px-3 pb-4 border-t border-white/5 pt-4">
          {user && (
            <div className="px-4 py-2 mb-2 rounded-xl bg-white/3">
              <p className="text-xs text-muted-foreground">Logado como</p>
              <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0c0e13]/80 backdrop-blur-xl overflow-x-auto scrollbar-thin">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                  isActive ? "bg-emerald-400/10 text-emerald-400" : "text-muted-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="ml-auto flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
