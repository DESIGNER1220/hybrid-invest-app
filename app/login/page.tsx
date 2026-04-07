"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUserByPhone } from "../services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      await loginUserByPhone(phone, password);
      router.push("/dashboard");
    } catch (error: any) {
      alert(error?.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 py-6 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400">
            Hybrid Invest
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Login</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-200">
              Número de telefone
            </label>
            <input
              type="text"
              placeholder="Ex: 840000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-200">Senha</label>
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-300">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-amber-400 hover:text-amber-300"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}