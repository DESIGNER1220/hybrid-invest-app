"use client";

import { useState } from "react";
import { auth } from "../lib/firebase";
import { redeemBonusCode } from "../services/authService";

type BonusResgateProps = {
  onSuccess?: () => void | Promise<void>;
};

export default function BonusResgate({ onSuccess }: BonusResgateProps) {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  async function handleResgatar() {
    try {
      setLoading(true);
      setSucesso("");
      setErro("");

      const uid = auth.currentUser?.uid;

      if (!uid) {
        throw new Error("Usuário não autenticado.");
      }

      if (!codigo.trim()) {
        throw new Error("Digite o código de bónus.");
      }

      await redeemBonusCode(uid, codigo);

      setSucesso("Bónus resgatado com sucesso!");
      setCodigo("");

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error: any) {
      setErro(error?.message || "Erro ao resgatar bónus.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: "16px",
        padding: "16px",
        color: "#fff",
        marginTop: "20px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Resgatar Bónus</h3>

      <input
        type="text"
        placeholder="Digite o código de bónus"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #4b5563",
          background: "#1f2937",
          color: "#fff",
          outline: "none",
          marginBottom: "12px",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleResgatar}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "none",
          background: loading ? "#6b7280" : "#16a34a",
          color: "#fff",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Resgatando..." : "Resgatar Bónus"}
      </button>

      {sucesso && (
        <p style={{ color: "#22c55e", marginTop: "12px" }}>{sucesso}</p>
      )}

      {erro && (
        <p style={{ color: "#ef4444", marginTop: "12px" }}>{erro}</p>
      )}
    </div>
  );
}