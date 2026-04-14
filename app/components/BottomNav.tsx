"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CircleDollarSign,
  History,
  Gift,
  User,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Início", icon: Home },
    { href: "/ativos", label: "Ativos", icon: CircleDollarSign },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/roda", label: "Roda", icon: Gift },
    { href: "/perfil", label: "Perfil", icon: User },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-md items-center justify-between px-2 py-2">

          {/* ITENS */}
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] transition ${
                  active
                    ? "text-emerald-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon size={20} strokeWidth={2.2} />
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}

          {/* BOTÃO HYBR NO CENTRO */}
          <Link
            href="/investimentos"
            className={`absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full border-4 shadow-xl transition ${
              pathname === "/investimentos"
                ? "border-amber-300 bg-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.45)]"
                : "border-amber-500 bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:bg-amber-400"
            }`}
          >
            <span className="text-sm font-extrabold tracking-wide">HYBR</span>
          </Link>

        </div>
      </nav>

      {/* BOLHA SUPORTE */}
      <Link
        href="/suporte"
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.45)] transition hover:scale-105"
      >
        <span className="text-xl font-bold">?</span>
      </Link>
    </>
  );
}