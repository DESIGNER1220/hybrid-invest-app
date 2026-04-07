"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RegisterForm from "./RegisterForm";

function RegisterContent() {
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-400">
            Hybrid Invest
          </p>
          <h1 className="mt-4 text-4xl font-bold">Criar Conta</h1>
          <p className="mt-2 text-sm text-slate-300">
            Registe-se com email, telefone e senha.
          </p>
        </div>

        <RegisterForm initialReferral={refFromUrl} />
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 py-10 text-white">
          <p>Carregando...</p>
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}