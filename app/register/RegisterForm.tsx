"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "../services/authService";

interface RegisterFormProps {
  initialReferral?: string | null;
}

export default function RegisterForm({ initialReferral }: RegisterFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referral, setReferral] = useState(initialReferral ?? "");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    if (!phone.trim()) {
      alert("Por favor, informe um número de telefone.");
      return;
    }

    try {
      setLoading(true);
      await registerUser(email, password, phone, referral || undefined);
      alert("Conta criada com sucesso!");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-yellow-300/80 bg-sky-100/95 p-8 shadow-2xl shadow-yellow-300/20 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-600">Hybrid Invest</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Criar Conta</h1>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-blue-500" />
          {initialReferral && (
            <p className="mt-3 rounded-full bg-sky-200 px-4 py-2 text-sm text-slate-900">
              Você foi convidado! Código: {initialReferral}
            </p>
          )}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Número de telefone</label>
            <input
              type="tel"
              placeholder="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Confirmar senha</label>
            <input
              type="password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Referência opcional</label>
            <input
              type="text"
              placeholder="Código de referência"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Criando..." : "Registrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Já tem conta?{' '}
          <span
            className="cursor-pointer text-blue-700 underline transition hover:text-blue-900"
            onClick={() => router.push("/login")}
          >
            Fazer login
          </span>
        </p>
      </div>
    </div>
  );
}
