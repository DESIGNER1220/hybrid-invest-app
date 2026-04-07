"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "../services/authService";

type RegisterFormProps = {
  initialReferral?: string | null;
};

export default function RegisterForm({
  initialReferral = "",
}: RegisterFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referral, setReferral] = useState(initialReferral || "");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);

      await registerUser({
        email,
        phone,
        password,
        confirmPassword,
        refCode: referral || null,
      });

      alert("Conta criada com sucesso!");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-slate-200">Email</label>
          <input
            type="email"
            placeholder="seuemail@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400"
          />
        </div>

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
            placeholder="Crie uma senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-200">
            Confirmar senha
          </label>
          <input
            type="password"
            placeholder="Confirme a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-200">
            Código de convite
          </label>
          <input
            type="text"
            placeholder="Opcional"
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-300">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-amber-400 hover:text-amber-300"
        >
          Fazer login
        </Link>
      </p>
    </>
  );
}