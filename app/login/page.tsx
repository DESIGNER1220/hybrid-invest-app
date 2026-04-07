"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      await loginUser(email, password);
      alert("Login realizado com sucesso");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-sky-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-yellow-300/80 bg-sky-100/95 p-8 shadow-2xl shadow-yellow-300/20 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-600">Hybrid Invest</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Login</h1>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-blue-500" />
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              placeholder="Seu email"
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              placeholder="Sua senha"
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}