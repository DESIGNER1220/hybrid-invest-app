"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Users,
  Wallet,
  Gift,
  MessageCircle,
} from "lucide-react";

const items = [
  { name: "Início", href: "/dashboard", icon: Home },
  { name: "Ativos", href: "/ativos", icon: Wallet },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Roda", href: "/roda", icon: Gift },
  { name: "Perfil", href: "/perfil", icon: User },
  { name: "Amigos", href: "/amigos", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-6 py-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition ${
                active ? "text-amber-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon size={20} strokeWidth={2.2} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}