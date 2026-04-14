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
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccess("");

      await loginUserByPhone(phone, password);

      // ✅ MOSTRA SUCESSO
      setSuccess("Sucesso");

      // ⏳ Espera 1.5s e redireciona
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-3 py-4 text-white">
      
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
        
        {/* TÍTULO */}
        <p className="text-center text-[10px] font-bold tracking-[0.25em] text-amber-400">
          HYBRID INVEST
        </p>

        <h1 className="mt-2 text-center text-3xl font-bold">Login</h1>

        <p className="mt-2 text-center text-sm text-slate-300">
          Entre com seu número e senha
        </p>

        {/* 🔥 SUCESSO */}
        {success && (
          <div className="mt-4 rounded-xl bg-emerald-500/20 border border-emerald-400 px-3 py-2 text-center text-sm font-bold text-emerald-400">
            {success}
          </div>
        )}

        {/* ❌ ERRO */}
        {errorMsg && (
          <div className="mt-4 rounded-xl bg-red-500/20 border border-red-400 px-3 py-2 text-center text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Número de telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Número de telefone"
              className="w-full rounded-xl bg-white px-4 py-3 text-base text-black outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full rounded-xl bg-white px-4 py-3 text-base text-black outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-400 py-3 text-lg font-bold text-black transition hover:bg-amber-300"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-bold text-amber-400">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}