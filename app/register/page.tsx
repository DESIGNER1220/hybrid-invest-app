"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerUser } from "../services/authService";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const refCode = useMemo(() => searchParams.get("ref"), [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

const ref = searchParams.get("ref");

  async function handleRegister() {
    try {
      setLoading(true);
      await registerUser(email, password, refCode);
      alert("Conta criada com sucesso");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Register</h1>

        {refCode && (
          <div className="mb-3 rounded border p-3 text-sm">
            Código de convite: <strong>{refCode}</strong>
          </div>
        )}

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
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-black text-white rounded p-3"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </div>
    </main>
  );
}