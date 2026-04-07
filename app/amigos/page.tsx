"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile } from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function AmigosPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [referralLink, setReferralLink] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const profile = await getUserProfile(currentUser.uid);
      setUserData(profile);

      if (typeof window !== "undefined" && profile?.referralCode) {
        setReferralLink(
          `${window.location.origin}/register?ref=${profile.referralCode}`
        );
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    alert("Link copiado!");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 pb-28 pt-6 text-white">
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Amigos</h1>
        <p className="mt-2 text-slate-300">
          Veja quantos amigos convidou e partilhe o seu link.
        </p>

        <div className="mt-6 flex items-center justify-center">
          <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-amber-400 bg-white/5 shadow-xl">
            <span className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Amigos
            </span>
            <span className="mt-2 text-5xl font-bold text-white">
              {userData?.referrals ?? 0}
            </span>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Seu link de convite</h2>

          <input
            value={referralLink}
            readOnly
            className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
          />

          <button
            onClick={copyLink}
            className="mt-4 rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Copiar link
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}