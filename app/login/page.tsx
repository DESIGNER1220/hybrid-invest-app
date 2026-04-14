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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      await loginUserByPhone(phone, password);
      router.push("/dashboard");
    } catch (error: any) {
      alert(error?.message || "Erro ao iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-8 text-white">
      <div className="mx-auto mt-10 max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_0_30px_rgba(0,0,0,0.25)] backdrop-blur-sm">
        <p className="mb-4 text-center text-sm font-bold tracking-[0.35em] text-amber-400">
          HYBRID INVEST
        </p>

        <h1 className="text-center text-5xl font-bold text-white">Login</h1>

        <p className="mx-auto mt-4 max-w-sm text-center text-lg text-slate-300">
          Entre usando o número de telefone e a senha.
        </p>

        <form onSubmit={handleLogin} className="mt-10 space-y-6">
          <div>
            <label className="mb-3 block text-2xl font-medium text-slate-100">
              Número de telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Número de telefone"
              className="w-full rounded-[28px] border border-white/10 bg-white px-6 py-5 text-2xl text-slate-900 outline-none placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="mb-3 block text-2xl font-medium text-slate-100">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full rounded-[28px] border border-white/10 bg-white px-6 py-5 text-2xl text-slate-900 outline-none placeholder:text-slate-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[28px] bg-amber-400 py-5 text-2xl font-bold text-black transition hover:bg-amber-300 disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-10 text-center text-xl text-slate-300">
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-bold text-amber-400">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}