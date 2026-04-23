"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ShoppingCart, BarChart2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inventario", label: "Inicio", icon: Home },
  { href: "/menu", label: "Menú", icon: BookOpen },
  { href: "/carrito", label: "Carrito", icon: ShoppingCart },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/gastos", label: "Gastos", icon: BarChart2 },
];

export function Navbar() {
  const pathname = usePathname();

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
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
                pathname === href ? "text-emerald-700" : "text-gray-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
