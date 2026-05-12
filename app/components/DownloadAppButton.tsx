"use client";

import { Download } from "lucide-react";

type DownloadAppButtonProps = {
  className?: string;
  label?: string;
};

export default function DownloadAppButton({
  className = "",
  label = "Instalar App",
}: DownloadAppButtonProps) {
  return (
    <a
      href="/app/hybrid-invest.apk"
      download="Hybrid-Invest.apk"
      className={`flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 px-4 py-4 text-base font-bold text-black transition hover:bg-amber-300 active:scale-[0.99] ${className}`}
    >
      <Download size={22} />
      <span>{label}</span>
    </a>
  );
}