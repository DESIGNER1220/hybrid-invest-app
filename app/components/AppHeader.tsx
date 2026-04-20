"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const hideHeader =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/dashboard";

  if (hideHeader) return null;

  return (
    <div className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-sm items-center px-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
      </div>
    </div>
  );
}