"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs font-bold text-green-300 transition hover:bg-white/20"
    >
      <ArrowLeft size={12} />
      Voltar
    </button>
  );
}