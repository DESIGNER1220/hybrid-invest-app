"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      await loginUser(email, password);
      alert("Login realizado com sucesso");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        <input
          type="email"
          placeholder="Seu email"
          className="w-full border rounded p-3 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Sua senha"
          className="w-full border rounded p-3 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white rounded p-3"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </main>
  );
}