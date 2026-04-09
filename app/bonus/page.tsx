"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { redeemBonusCode } from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function BonusPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [footerError, setFooterError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFooterError("");
    setSuccessMessage("");

    if (!uid) {
      setFooterError("Utilizador não autenticado");
      return;
    }

    if (!code.trim()) {
      setFooterError("Digite o código de bónus");
      return;
    }

    try {
      setLoading(true);

      await redeemBonusCode(uid, code);

      setSuccessMessage("Sucesso");

      setTimeout(() => {
        router.push("/perfil");
      }, 1500);
    } catch (error: any) {
      setFooterError(error?.message || "Erro ao usar código");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-28 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-bold">Sorteio / Bónus</h1>

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-lg font-bold text-emerald-400">{successMessage}</p>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">
            Digite o código de bónus enviado pelo administrador.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: BONUS100"
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center text-lg font-bold uppercase text-white outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 px-4 py-3 font-bold text-black transition hover:bg-amber-400 disabled:opacity-70"
            >
              {loading ? "Processando..." : "Usar código"}
            </button>
          </form>
        </div>
      </div>

      {footerError && (
        <div className="fixed bottom-20 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
          <p className="text-sm font-bold text-red-400">{footerError}</p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}