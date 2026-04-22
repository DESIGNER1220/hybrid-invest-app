"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MessageCircle, Gift, User, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const HOME_ROUTE = "/dashboard";

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

  const isInicio = pathname === HOME_ROUTE;
  const isChat = pathname === "/chat-global";
  const isInvestimentos =
    pathname === "/investimentos" ||
    pathname === "/aluguel" ||
    pathname === "/planos";
  const isRoda = pathname === "/roda";
  const isPerfil = pathname === "/perfil";
  const isAtivos = pathname === "/ativos"; // ✅ NOVO

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#020817] pb-2 pt-2">
      <div className="mx-auto flex max-w-sm items-end justify-around px-2">

        {/* INICIO */}
        <Link
          href={HOME_ROUTE}
          className={`flex w-14 flex-col items-center justify-center gap-1 ${
            isInicio ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <House size={22} />
          <span className="text-[11px] font-medium">Início</span>
        </Link>

        {/* CHAT */}
        <Link
          href="/chat-global"
          className={`relative flex w-14 flex-col items-center justify-center gap-1 ${
            isChat ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <div className="relative">
            <MessageCircle size={22} />
            {chatUnread > 0 && (
              <span className="absolute -right-2 -top-2 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {chatUnread > 99 ? "99+" : chatUnread}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium">Chat</span>
        </Link>

        {/* BOTAO CENTRAL */}
        <Link
          href="/investimentos"
          className="relative -mt-8 flex h-24 w-24 flex-col items-center justify-center"
        >
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#020817] text-xl font-bold shadow-lg ${
              isInvestimentos
                ? "bg-emerald-500 text-black"
                : "bg-amber-500 text-black"
            }`}
          >
            HYBR
          </div>
        </Link>

        {/* ATIVOS (NOVO) */}
        <Link
          href="/ativos"
          className={`flex w-14 flex-col items-center justify-center gap-1 ${
            isAtivos ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <TrendingUp size={22} />
          <span className="text-[11px] font-medium">Ativos</span>
        </Link>

        {/* RODA */}
        <Link
          href="/roda"
          className={`flex w-14 flex-col items-center justify-center gap-1 ${
            isRoda ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <Gift size={22} />
          <span className="text-[11px] font-medium">Roda</span>
        </Link>

        {/* PERFIL */}
        <Link
          href="/perfil"
          className={`flex w-14 flex-col items-center justify-center gap-1 ${
            isPerfil ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <User size={22} />
          <span className="text-[11px] font-medium">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}