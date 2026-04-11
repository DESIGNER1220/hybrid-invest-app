"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getUserProfile,
  getUserInvestments,
  getWheelSpinHistory,
  spinWheel,
  type WheelSpinHistoryItem,
} from "../services/authService";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

const wheelItems = [
  { label: "50 MZN", value: 50, color: "bg-amber-500" },
  { label: "5 MZN", value: 5, color: "bg-blue-500" },
  { label: "10 MZN", value: 10, color: "bg-emerald-500" },
  { label: "500 MZN", value: 500, color: "bg-fuchsia-500" },
  { label: "1000 MZN", value: 1000, color: "bg-red-500" },
  { label: "BOA SORTE", value: 0, color: "bg-slate-500" },
];

function formatDateTime(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "Data indisponível";

  return new Date(timestamp.seconds * 1000).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RodaPage() {
  const router = useRouter();
  const audioContextRef = useRef<AudioContext | null>(null);

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [footerMessage, setFooterMessage] = useState("");
  const [referrals, setReferrals] = useState(0);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [history, setHistory] = useState<WheelSpinHistoryItem[]>([]);

  async function loadAll(userId: string) {
    const [profile, investments, historyData] = await Promise.all([
      getUserProfile(userId),
      getUserInvestments(userId),
      getWheelSpinHistory(userId),
    ]);

    const userProfile: any = profile;
    const userInvestments: any[] = Array.isArray(investments) ? investments : [];

    const totalInvested = userInvestments.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0
    );

    setReferrals(Number(userProfile?.referrals ?? 0));
    setInvestedAmount(totalInvested);
    setHistory(historyData || []);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);

      try {
        await loadAll(user.uid);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  function vibrateWin(isGood: boolean) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(isGood ? [120, 60, 120] : [80]);
    }
  }

  function beep(frequency: number, duration = 120) {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.03;

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
      console.error("Erro no som:", error);
    }
  }

  function playSpinSound() {
    beep(420, 80);
    setTimeout(() => beep(520, 80), 120);
    setTimeout(() => beep(620, 120), 240);
  }

  function playResultSound(reward: number) {
    if (reward > 0) {
      beep(700, 150);
      setTimeout(() => beep(900, 200), 180);
      vibrateWin(true);
    } else {
      beep(320, 120);
      vibrateWin(false);
    }
  }

  function getTargetAngleByReward(reward: number) {
    const rewardIndex = wheelItems.findIndex((item) => item.value === reward);
    const sliceAngle = 360 / wheelItems.length;
    const centerAngle = rewardIndex * sliceAngle + sliceAngle / 2;
    const pointerAngle = 0;
    const correction = 360 - centerAngle + pointerAngle;

    return correction;
  }

  async function handleSpin() {
    if (!uid || spinning) return;

    try {
      setFooterMessage("");
      setResult("");
      setSpinning(true);

      const spinData = await spinWheel(uid);
      const targetAngle = getTargetAngleByReward(spinData.reward);
      const extraTurns = 360 * 6;
      const finalRotation = rotation + extraTurns + targetAngle;

      playSpinSound();
      setRotation(finalRotation);

      setTimeout(async () => {
        setResult(spinData.label);
        playResultSound(spinData.reward);
        await loadAll(uid);
        setSpinning(false);
      }, 4200);
    } catch (error: any) {
      setFooterMessage(error?.message || "Erro ao girar");
      setSpinning(false);
    }
  }

  const nextRuleMessage = useMemo(() => {
    if (referrals < 1) {
      return "Convide pelo menos 1 pessoa para ativar a roda";
    }

    if (investedAmount < 100) {
      return "Sem investimento: recebe apenas BOA SORTE";
    }

    if (investedAmount >= 50000) {
      return "Investimento alto: pode ganhar até 500 MZN";
    }

    return "Investimento de 100 MZN ou mais: pode ganhar até 10 MZN";
  }, [referrals, investedAmount]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-4">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pt-4 pb-28 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-bold text-center">Roda da Sorte</h1>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-slate-400">Amigos convidados</p>
            <p className="mt-1 text-lg font-bold text-blue-400">{referrals}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-slate-400">Total investido</p>
            <p className="mt-1 text-lg font-bold text-amber-400">
              {investedAmount.toLocaleString("pt-MZ")} MZN
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-xs text-slate-400">Regra ativa</p>
          <p className="mt-1 text-sm font-semibold text-white">{nextRuleMessage}</p>
        </div>

        <div className="relative mx-auto flex h-80 w-80 items-center justify-center">
          <div className="absolute top-0 z-20 h-0 w-0 border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-amber-400" />

          <div
            className="relative h-72 w-72 overflow-hidden rounded-full border-8 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.35)]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4.2s cubic-bezier(0.15, 0.85, 0.2, 1)" : "none",
            }}
          >
            {wheelItems.map((item, index) => {
              const rotationDeg = index * 60;

              return (
                <div
                  key={item.label}
                  className={`absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-bottom-left ${item.color} border border-black/10`}
                  style={{
                    transform: `rotate(${rotationDeg}deg) skewY(-30deg)`,
                    transformOrigin: "0% 100%",
                  }}
                >
                  <div
                    className="absolute left-8 top-6 -rotate-[60deg] text-[10px] font-bold text-white"
                    style={{ transform: "skewY(30deg) rotate(30deg)" }}
                  >
                    {item.label}
                  </div>
                </div>
              );
            })}

            <div className="absolute left-1/2 top-1/2 z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/20 bg-slate-950 shadow-lg" />
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-70"
        >
          {spinning ? "Girando..." : "Girar roda"}
        </button>

        {result && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-lg font-bold text-emerald-400">{result}</p>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <h2 className="text-sm font-bold text-amber-400">Histórico de prêmios</h2>

          {history.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">Nenhum giro registado.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-slate-950/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {footerMessage && (
        <div className="fixed bottom-20 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
          <p className="text-sm font-bold text-red-400">{footerMessage}</p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}