"use client";

import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 py-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
        <div className="mb-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-400">
            Hybrid Invest
          </p>
          <h1 className="mt-2 text-3xl font-bold">Criar Conta</h1>
          <p className="mt-2 text-sm text-slate-300">
            Registe-se para começar a investir.
          </p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}