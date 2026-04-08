"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile } from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function AmigosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const profile: any = await getUserProfile(user.uid);
        setReferralCode(profile?.referralCode || "");
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const inviteLink = useMemo(() => {
    if (!referralCode) return "";
    return `https://www.hybrunimoz.mom/register?ref=${referralCode}`;
  }, [referralCode]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Erro ao copiar");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-24 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-bold">Amigos</h1>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Seu código de referência</p>
          <h2 className="mt-1 text-base font-bold text-amber-400">
            {referralCode || "Sem código"}
          </h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Seu link de convite</p>
          <p className="mt-2 break-all text-xs text-slate-300">
            {inviteLink || "Link indisponível"}
          </p>

          <button
            onClick={copyLink}
            className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}