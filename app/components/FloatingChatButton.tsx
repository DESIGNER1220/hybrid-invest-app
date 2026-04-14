"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function FloatingChatButton() {
  const pathname = usePathname();

  if (
    pathname === "/chat" ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return null;
  }

  return (
    <Link
      href="/chat"
      className="fixed right-4 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg transition hover:scale-105 hover:bg-emerald-400"
      aria-label="Abrir chat"
    >
      <MessageCircle size={24} strokeWidth={2.4} />
    </Link>
  );
}