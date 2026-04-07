"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { createTransaction } from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function DepositoPage() {
  const router = useRouter();

  const [method, setMethod] = useState<"M-Pesa" | "E-mola">("M-Pesa");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      await createTransaction({
        uid: currentUser.uid,
        type: "deposito",
        method,
        phone,
        amount: Number(amount),
      });

      alert("Pedido de depósito enviado com sucesso.");
      router.push("/historicos");
    } catch (error: any) {
      alert(error?.message || "Erro ao criar depósito");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Depósito</h1>
        <p className="mt-2 text-slate-300">
          Escolha o método e envie o seu pedido de depósito.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-200">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as "M-Pesa" | "E-mola")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
            >
              <option value="M-Pesa">M-Pesa</option>
              <option value="E-mola">E-mola</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-200">Número</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 840000000"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-200">Valor (MZN)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 500"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-70"
          >
            {loading ? "Enviando..." : "Enviar depósito"}
          </button>
        </form>
      </div>

      <BottomNav />
    </main>
  );
}