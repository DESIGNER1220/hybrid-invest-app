"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { name: "Início", href: "/dashboard" },
  { name: "Ativos", href: "/ativos" },
  { name: "Roda", href: "/roda" },
  { name: "Amigos", href: "/amigos" },
  { name: "Perfil", href: "/perfil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 text-[11px] font-semibold transition ${
                active ? "text-amber-400" : "text-slate-400 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}