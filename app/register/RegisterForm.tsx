"use client";
import Loader from "../components/Loader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "../services/authService";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref?.trim()) setRefCode(ref.trim().toUpperCase());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");
      await registerUser({ email, phone, password, confirmPassword, refCode });
      router.push("/login");
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-3 py-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-bold text-center mb-4">Criar Conta</h1>
        {errorMsg && <div className="mb-4 text-red-400 text-center">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"/>
          <input type="tel" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"/>
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"/>
          <input type="password" placeholder="Confirmar senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"/>
          <input type="text" placeholder="Código de referência" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"/>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-amber-400 py-3 text-lg font-bold text-black hover:bg-amber-300 disabled:opacity-70">
            Criar Conta
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-300">
          Já tem conta? <Link href="/login" className="font-bold text-amber-400">Entrar</Link>
        </p>
      </div>
    </main>
  );
}