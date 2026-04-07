"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavIcon({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
        active ? "bg-amber-500 text-slate-950" : "bg-white/5 text-white"
      }`}
    >
      {children}
    </div>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Início", key: "inicio" },
    { href: "/ativos", label: "Activos", key: "activos" },
    { href: "/historicos", label: "Histórico", key: "historicos" },
    { href: "/amigos", label: "Amigos", key: "amigos" },
    { href: "/perfil", label: "Perfil", key: "perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-2 px-3 py-3">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1"
            >
              <NavIcon active={active}>
                {item.key === "inicio" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
                {item.key === "activos" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 15l3-3 2 2 4-5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
                {item.key === "historicos" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
                {item.key === "amigos" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 19c.2-2 1.5-3.5 3.8-4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
                {item.key === "perfil" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </NavIcon>

              <span
                className={`text-[11px] ${
                  active ? "text-amber-400" : "text-slate-300"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}