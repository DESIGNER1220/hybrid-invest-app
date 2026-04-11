"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Users,
  History,
  Gift,
} from "lucide-react";

const items = [
  { name: "Início", href: "/dashboard", icon: Home },
  { name: "Ativos", href: "/ativos", icon: History },
  { name: "Roda", href: "/roda", icon: Gift },
  { name: "Amigos", href: "/amigos", icon: Users },
  { name: "Perfil", href: "/perfil", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-white/10">
      <div className="grid grid-cols-5 text-center py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center text-xs ${
                active ? "text-amber-400" : "text-slate-400"
              }`}
            >
              <Icon size={22} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}