"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile } from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function AmigosPage() {
  const router = useRouter();

  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const profile: any = await getUserProfile(user.uid);

      setReferralCode(profile?.referralCode || "");
      setReferrals(profile?.referrals || 0);
    });

    return () => unsubscribe();
  }, [router]);

  const link = `https://www.hybrunimoz.mom/register?ref=${referralCode}`;

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 pt-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">

        <h1 className="text-xl font-bold">Amigos</h1>

        {/* Número de amigos */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
          <p className="text-sm text-slate-400">Total de amigos</p>
          <h2 className="text-2xl font-bold text-amber-400">{referrals}</h2>
        </div>

        {/* Link */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <p className="text-xs text-slate-400">Seu link de convite</p>

          <p className="mt-2 text-xs break-all">{link}</p>

          <button
            onClick={copyLink}
            className="mt-3 w-full bg-blue-600 py-2 rounded-lg text-sm font-bold"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>

      </div>

      <BottomNav />
    </main>
  );
}