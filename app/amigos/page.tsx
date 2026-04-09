"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile } from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  referralCode?: string;
  referrals?: number;
};

export default function AmigosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const data = await getUserProfile(user.uid);
        setProfile((data as UserProfile) || null);
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const referralCode = profile?.referralCode || "";
  const referrals = Number(profile?.referrals ?? 0);

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

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
          <div>
            <p className="text-xs text-slate-400">Seu código de referência</p>
            <h2 className="mt-1 text-base font-bold text-amber-400">
              {referralCode || "Sem código"}
            </h2>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
            <div className="text-center">
              <p className="text-[10px] leading-none">Conv.</p>
              <p className="mt-1 text-sm font-bold leading-none">{referrals}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Seu link de convite</p>
          <p className="mt-2 break-all text-xs text-slate-300">
            {inviteLink || "Link indisponível"}
          </p>

          <button
            onClick={copyLink}
            className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}