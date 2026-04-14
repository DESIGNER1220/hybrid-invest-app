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
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setSuccessMessage("");
      setErrorMessage("");

      await loginUserByPhone(phone, password);

      setSuccessMessage("Sucesso");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error: any) {
      setErrorMessage(error?.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
              Hybrid Invest
            </p>
            <h1 className="mt-3 text-3xl font-bold">Login</h1>
            <p className="mt-2 text-sm text-slate-300">
              Entre usando o número de telefone e a senha.
            </p>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
              <p className="font-semibold text-emerald-400">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-200">
                Número de telefone
              </label>
              <input
                type="text"
                placeholder="Ex: 869933273"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
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
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            Ainda não tem conta?{" "}
            <Link
              href="/register"
              className="font-semibold text-amber-400 hover:text-amber-300"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center shadow-lg backdrop-blur">
          <p className="text-sm font-bold text-red-400">{errorMessage}</p>
        </div>
      )}
    </main>
  );
}