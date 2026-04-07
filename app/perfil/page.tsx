"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import BottomNav from "../components/BottomNav";
import { getUserProfile, logoutUser } from "../services/authService";

export default function PerfilPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const profile = await getUserProfile(currentUser.uid);
      setIsAdmin(profile?.role === "admin");
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Perfil</h1>
        <p className="mt-2 text-slate-300">Definições da conta.</p>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/deposito")}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Depósito
            </button>

            <button
              onClick={() => router.push("/levantamento")}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Levantamento
            </button>

            {isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Admin
              </button>
            )}

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
            >
              Terminar sessão
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}