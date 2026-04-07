"use client";

import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { getUserProfile } from "../services/authService";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.push("/login");
    } else {
      const profile = await getUserProfile(user.uid);
      setUserData(profile);
    }
  });

  return () => unsubscribe();
}, []);
  

  function copyLink() {
    if (!userData?.referralCode) return;

    const link = `${window.location.origin}/register?ref=${userData.referralCode}`;
    navigator.clipboard.writeText(link);
    alert("Link copiado!");
  }

  if (!userData) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">HYBRID INVEST</h1>
        <p className="text-gray-500">Bem-vindo, {userData.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="bg-white rounded-2xl p-4 shadow">
          <p className="text-gray-500">Saldo</p>
          <h2 className="text-2xl font-bold">$0.00</h2>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <p className="text-gray-500">Bónus</p>
          <h2 className="text-2xl font-bold text-green-600">
            ${userData.bonusBalance || 0}
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <p className="text-gray-500">Convites</p>
          <h2 className="text-2xl font-bold">
            {userData.totalReferrals || 0}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <p className="font-bold mb-2">Seu link de convite</p>

        <input
          readOnly
          value={`${window.location.origin}/register?ref=${userData.referralCode}`}
          className="w-full border rounded-lg p-2 mb-2"
        />

        <button
          onClick={copyLink}
          className="w-full bg-black text-white py-2 rounded-lg"
        >
          Copiar link
        </button>
      </div>
    </main>
  );
}