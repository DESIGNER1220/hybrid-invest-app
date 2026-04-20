"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/perfil": "Perfil",
  "/bonus": "Bónus",
  "/deposito": "Depósito",
  "/levantamento": "Levantamento",
  "/login": "Entrar",
  "/register": "Criar conta",
};

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const title = useMemo(() => {
    return TITLES[pathname] || "HYBRID";
  }, [pathname]);

  const hideHeader =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register";

  if (hideHeader) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-sm items-center gap-3 px-3 text-white">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-sm font-bold">{title}</h1>
      </div>
    </div>
  );
}