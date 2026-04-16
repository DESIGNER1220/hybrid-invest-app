"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { registerUser } from "../services/authService";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 🔥 AQUI É O SEGREDO
  useEffect(() => {
    const ref = searchParams.get("ref");

    if (ref) {
      setRefCode(ref.toUpperCase());
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      await registerUser({
        email,
        phone,
        password,
        confirmPassword,
        refCode: refCode.trim() || null,
      });

      setSuccessMsg("Conta criada com sucesso");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  const autoFilled = !!searchParams.get("ref");

  return (
    <>
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
        <div>
          <label className="mb-1 block text-sm text-slate-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu email"
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">
            Número de telefone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Número de telefone"
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
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
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">
            Confirmar senha
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme a senha"
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
            required
          />
        </div>

        {/* 🔥 CAMPO DE REFERÊNCIA */}
        <div>
          <label className="mb-1 block text-sm text-slate-300">
            Código de referência
          </label>
          <input
            type="text"
            value={refCode}
            onChange={(e) => setRefCode(e.target.value.toUpperCase())}
            placeholder="Código de referência"
            className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
          />

          {autoFilled && (
            <p className="mt-1 text-xs font-semibold text-emerald-400">
              Código preenchido automaticamente
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-amber-400 py-3 text-lg font-bold text-black transition hover:bg-amber-300 disabled:opacity-70"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-300">
        Já tem conta?{" "}
        <Link href="/login" className="font-bold text-amber-400">
          Entrar
        </Link>
      </p>
    </>
  );
}