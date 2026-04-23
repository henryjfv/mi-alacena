"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Home, BookOpen, BarChart2, CalendarDays, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inventario", label: "Inicio", icon: Home },
  { href: "/menu", label: "Catálogo", icon: BookOpen },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/gastos", label: "Gastos", icon: BarChart2 },
];

function UserAvatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email?.split("@")[0];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col bg-white border-r border-gray-100 z-40">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-emerald-700">🏠 Mi Alacena</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona tu despensa</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserAvatar name={userName} />
            <span className="text-sm font-medium text-gray-700 truncate">{userName}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-emerald-700">🏠 Mi Alacena</h1>
        <div className="flex items-center gap-2">
          <UserAvatar name={userName} />
          <span className="text-sm font-medium text-gray-700 max-w-24 truncate">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1 text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="flex items-center justify-around px-1 py-2 pb-safe">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-13",
                pathname === href ? "text-emerald-700" : "text-gray-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
