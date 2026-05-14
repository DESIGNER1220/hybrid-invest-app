"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "../services/authService";
import Loader from "../components/Loader";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref?.trim()) {
      setRefCode(ref.trim().toUpperCase());
      setAutoFilled(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      await registerUser({
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        refCode: refCode.trim() || null,
      });
      setSuccessMsg("Sucesso");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-3 py-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-400 bg-emerald-500/20 px-3 py-2 text-center text-sm font-bold text-emerald-300">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-400 bg-red-500/20 px-3 py-2 text-center text-sm text-red-300">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
            required
          />
          <input
            type="tel"
            placeholder="Número de telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
            required
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
            required
          />
          <input
            type="text"
            placeholder="Código de referência"
            value={refCode}
            onChange={(e) => setRefCode(e.target.value.toUpperCase())}
            readOnly={autoFilled}
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-400 py-3 text-lg font-bold text-black transition hover:bg-amber-300 disabled:opacity-70"
          >
            Criar conta
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-300">
          Já tem conta?{" "}
          <Link href="/login" className="font-bold text-amber-400">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}