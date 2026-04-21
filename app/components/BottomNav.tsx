"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CircleDollarSign, Gift, User } from "lucide-react";
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

  const isInicio = pathname === "/" || pathname === "/inicio";
  const isAtivos = pathname === "/ativos";
  const isRoda = pathname === "/roda" || pathname === "/chat-global";
  const isPerfil = pathname === "/perfil";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#020817] pb-2 pt-2">
      <div className="mx-auto flex max-w-sm items-end justify-around px-2">
        <Link
          href="/"
          className={`flex w-16 flex-col items-center justify-center gap-1 ${
            isInicio ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <House size={24} />
          <span className="text-xs font-medium">Início</span>
        </Link>

        <Link
          href="/ativos"
          className={`flex w-16 flex-col items-center justify-center gap-1 ${
            isAtivos ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <CircleDollarSign size={24} />
          <span className="text-xs font-medium">Ativos</span>
        </Link>

        <Link
          href="/roda"
          className="relative -mt-8 flex h-24 w-24 flex-col items-center justify-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#020817] bg-amber-500 text-xl font-bold text-black shadow-lg">
            HYBR
          </div>

          {chatUnread > 0 ? (
            <span className="absolute right-2 top-2 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {chatUnread > 99 ? "99+" : chatUnread}
            </span>
          ) : null}
        </Link>

        <Link
          href="/roda"
          className={`flex w-16 flex-col items-center justify-center gap-1 ${
            isRoda ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <Gift size={24} />
          <span className="text-xs font-medium">Roda</span>
        </Link>

        <Link
          href="/perfil"
          className={`flex w-16 flex-col items-center justify-center gap-1 ${
            isPerfil ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <User size={24} />
          <span className="text-xs font-medium">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}