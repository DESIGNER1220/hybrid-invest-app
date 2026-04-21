"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Wallet, User, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    function updateUnread() {
      const value = Number(localStorage.getItem("chatGlobalUnread") || "0");
      setChatUnread(value);
    }

    updateUnread();

    window.addEventListener("chat-global-unread-changed", updateUnread);
    window.addEventListener("storage", updateUnread);

    return () => {
      window.removeEventListener("chat-global-unread-changed", updateUnread);
      window.removeEventListener("storage", updateUnread);
    };
  }, []);

  const items = [
    {
      href: "/home",
      label: "Início",
      icon: House,
    },
    {
      href: "/deposito",
      label: "Carteira",
      icon: Wallet,
    },
    {
      href: "/chat-global",
      label: "Chat",
      icon: MessageCircle,
      badge: chatUnread,
    },
    {
      href: "/perfil",
      label: "Perfil",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-sm -translate-x-1/2 border-t border-white/10 bg-black/95 px-2 py-2 backdrop-blur">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center rounded-2xl py-2 text-xs transition ${
                active
                  ? "bg-fuchsia-500/15 text-fuchsia-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {"badge" in item && item.badge && item.badge > 0 ? (
                  <span className="absolute -right-2 -top-2 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}