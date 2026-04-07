"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { getUserProfile, logoutUser } from "../services/authService";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);

        const profile = await getUserProfile(currentUser.uid);
        setUserData(profile);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Carregando...</p>;

  const referralLink = `${window.location.origin}/register?ref=${userData?.referralCode}`;

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    alert("Link copiado!");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>HYBRID INVEST</h1>

      <hr />

      <h2>Bem-vindo</h2>
      <p>{user?.email}</p>

      <hr />

      <h3>💰 Saldo</h3>
      <p>${userData?.balance || 0}</p>

      <h3>🎁 Bônus</h3>
      <p>${userData?.bonus || 0}</p>

      <h3>👥 Convites</h3>
      <p>{userData?.referrals || 0}</p>

      <hr />

      <h3>🔗 Seu link de convite</h3>
      <input
        value={referralLink}
        readOnly
        style={{ width: "100%", padding: "8px" }}
      />

      <br />
      <br />

      <button onClick={copyLink}>📋 Copiar link</button>

      <br />
      <br />

      <button onClick={logoutUser}>🚪 Logout</button>
    </div>
  );
}