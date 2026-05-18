"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  MessageCircle,
  Gift,
  User,
  TrendingUp,
  History,
} from "lucide-react";
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
  const isAtivos = pathname === "/ativos";
  const isHistoricos = pathname === "/historicos";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#020817] pb-2 pt-2">
      <div className="mx-auto flex max-w-md items-end justify-around px-1">
        {/* INICIO */}
        <Link
          href={HOME_ROUTE}
          className={`flex w-12 flex-col items-center justify-center gap-1 ${
            isInicio ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <House size={21} />
          <span className="text-[10px] font-medium">Início</span>
        </Link>

        {/* CHAT */}
        <Link
          href="/chat-global"
          className={`relative flex w-12 flex-col items-center justify-center gap-1 ${
            isChat ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <div className="relative">
            <MessageCircle size={21} />
            {chatUnread > 0 && (
              <span className="absolute -right-2 -top-2 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {chatUnread > 99 ? "99+" : chatUnread}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Chat</span>
        </Link>

        {/* BOTAO CENTRAL */}
        <Link
          href="/investimentos"
          className="relative -mt-8 flex h-24 w-20 flex-col items-center justify-center"
        >
          <div
            className={`flex h-18 w-18 items-center justify-center rounded-full border-4 border-[#020817] px-3 py-4 text-base font-bold shadow-lg ${
              isInvestimentos
                ? "bg-emerald-500 text-black"
                : "bg-amber-500 text-black"
            }`}
          >
            ProJectos
          </div>
        </Link>

        {/* ATIVOS */}
        <Link
          href="/ativos"
          className={`flex w-12 flex-col items-center justify-center gap-1 ${
            isAtivos ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <TrendingUp size={21} />
          <span className="text-[10px] font-medium">Ativos</span>
        </Link>

        {/* RODA */}
        <Link
          href="/roda"
          className={`flex w-12 flex-col items-center justify-center gap-1 ${
            isRoda ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <Gift size={21} />
          <span className="text-[10px] font-medium">Roda</span>
        </Link>

        {/* PERFIL */}
        <Link
          href="/perfil"
          className={`flex w-12 flex-col items-center justify-center gap-1 ${
            isPerfil ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <User size={21} />
          <span className="text-[10px] font-medium">Perfil</span>
        </Link>

        {/* HISTÓRICO */}
        <Link
          href="/historicos"
          className={`flex w-12 flex-col items-center justify-center gap-1 ${
            isHistoricos ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          <History size={21} />
          <span className="text-[10px] font-medium">Histórico</span>
        </Link>
      </div>
    </nav>
  );
}