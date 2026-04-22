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

const normalWheelItems = [
  { label: "50 MZN", value: 50, color: "#f59e0b" },
  { label: "5 MZN", value: 5, color: "#3b82f6" },
  { label: "10 MZN", value: 10, color: "#10b981" },
  { label: "500 MZN", value: 500, color: "#d946ef" },
  { label: "1000 MZN", value: 1000, color: "#ef4444" },
  { label: "BOA SORTE", value: 0, color: "#64748b" },
];

const weekendWheelItems = [
  { label: "10 MZN", value: 10, color: "#22c55e" },
  { label: "20 MZN", value: 20, color: "#06b6d4" },
  { label: "50 MZN", value: 50, color: "#f59e0b" },
  { label: "100 MZN", value: 100, color: "#a855f7" },
  { label: "500 MZN", value: 500, color: "#ec4899" },
  { label: "1000 MZN", value: 1000, color: "#ef4444" },
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

function isWeekendNow() {
  const day = new Date().getDay();
  return day === 6 || day === 0;
}

export default function RodaPage() {
  const router = useRouter();
  const audioContextRef = useRef<AudioContext | null>(null);
  const tickTimeoutsRef = useRef<number[]>([]);

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [footerMessage, setFooterMessage] = useState("");
  const [referrals, setReferrals] = useState(0);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [history, setHistory] = useState<WheelSpinHistoryItem[]>([]);
  const [activeSlice, setActiveSlice] = useState<number | null>(null);
  const [weekendPromo, setWeekendPromo] = useState(false);

  const wheelItems = useMemo(
    () => (weekendPromo ? weekendWheelItems : normalWheelItems),
    [weekendPromo]
  );

  const sliceAngle = 360 / wheelItems.length;

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
    setWeekendPromo(Boolean(userProfile?.isWeekendPromo ?? isWeekendNow()));
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

  useEffect(() => {
    return () => {
      clearTicking();
    };
  }, []);

  function clearTicking() {
    tickTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    tickTimeoutsRef.current = [];
  }

  function getAudioContext() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioCtx) return null;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      return audioContextRef.current;
    } catch {
      return null;
    }
  }

  function vibrateWin(isGood: boolean) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(isGood ? [120, 60, 120] : [80]);
    }
  }

  function beep(
    frequency: number,
    duration = 120,
    type: OscillatorType = "sine",
    volume = 0.03
  ) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
      console.error("Erro no som:", error);
    }
  }

  function playTickSound() {
    beep(1850, 16, "square", 0.022);
  }

  function startTicking() {
    clearTicking();

    let index = 0;
    const delays = [
      0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900, 990, 1080, 1170,
      1260, 1350, 1440, 1530, 1620, 1710, 1810, 1920, 2040, 2180, 2340, 2520,
      2730, 2970, 3240, 3550,
    ];

    delays.forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        playTickSound();
        setActiveSlice(index % wheelItems.length);
        index += 1;
      }, delay);

      tickTimeoutsRef.current.push(timeoutId);
    });
  }

  function playSpinSound() {
    startTicking();
    beep(420, 50);
    window.setTimeout(() => beep(520, 50), 100);
    window.setTimeout(() => beep(620, 70), 220);
  }

  function playResultSound(reward: number) {
    if (reward > 0) {
      beep(700, 150);
      window.setTimeout(() => beep(900, 200), 180);
      window.setTimeout(() => beep(1100, 220), 380);
      vibrateWin(true);
    } else {
      beep(320, 120, "sawtooth", 0.03);
      vibrateWin(false);
    }
  }

  function getTargetAngleByReward(reward: number) {
    const rewardIndex = wheelItems.findIndex((item) => item.value === reward);
    const safeIndex = rewardIndex >= 0 ? rewardIndex : 0;
    const centerAngle = safeIndex * sliceAngle + sliceAngle / 2;
    return 360 - centerAngle;
  }

  async function handleSpin() {
    if (!uid || spinning) return;

    try {
      setFooterMessage("");
      setResult("");
      setSpinning(true);
      setActiveSlice(0);

      const spinData: any = await spinWheel(uid);
      const targetAngle = getTargetAngleByReward(spinData.reward);
      const extraTurns = 360 * 6;
      const finalRotation = rotation + extraTurns + targetAngle;

      playSpinSound();
      setRotation(finalRotation);

      window.setTimeout(async () => {
        clearTicking();

        const winnerIndex = wheelItems.findIndex(
          (item) => item.value === spinData.reward
        );

        setActiveSlice(winnerIndex >= 0 ? winnerIndex : null);
        setResult(spinData.label);
        playResultSound(spinData.reward);
        await loadAll(uid);
        setSpinning(false);
      }, 4200);
    } catch (error: any) {
      clearTicking();
      setFooterMessage(error?.message || "Erro ao girar");
      setSpinning(false);
    }
  }

  const nextRuleMessage = useMemo(() => {
    if (referrals < 1) {
      return "Convide pelo menos 1 pessoa para ativar a roda";
    }

    if (weekendPromo) {
      if (investedAmount < 100) {
        return "Fim de semana: sem investimento ainda recebe apenas BOA SORTE";
      }

      if (investedAmount >= 50000) {
        return "Fim de semana premiado: pode ganhar até 1000 MZN com chances melhores";
      }

      if (investedAmount >= 1000) {
        return "Fim de semana premiado: pode ganhar até 500 MZN com chances melhores";
      }

      return "Fim de semana premiado: mais chances de 10, 20 e 50 MZN";
    }

    if (investedAmount < 100) {
      return "Sem investimento: recebe apenas BOA SORTE";
    }

    if (investedAmount >= 50000) {
      return "Investimento alto: pode ganhar até 1000 MZN";
    }

    if (investedAmount >= 1000) {
      return "Investimento médio: pode ganhar até 500 MZN";
    }

    return "Investimento de 100 MZN ou mais: pode ganhar até 50 MZN";
  }, [referrals, investedAmount, weekendPromo]);

  const canSpin = referrals >= 1;

  const wheelGradient = useMemo(() => {
    let current = 0;

    const parts = wheelItems.map((item) => {
      const start = current;
      const end = current + sliceAngle;
      current = end;
      return `${item.color} ${start}deg ${end}deg`;
    });

    return `conic-gradient(${parts.join(", ")})`;
  }, [sliceAngle, wheelItems]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pt-4 pb-28 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-center text-xl font-bold">
          {weekendPromo ? "Roda da Sorte • Fim de Semana" : "Roda da Sorte"}
        </h1>

        {weekendPromo && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
              Fim de semana premiado
            </p>
            <p className="mt-1 text-sm text-white">
              Chances melhores e prémios especiais para incentivar mais depósitos
              e investimentos.
            </p>
          </div>
        )}

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
          <p className="mt-1 text-sm font-semibold text-white">
            {nextRuleMessage}
          </p>
        </div>

        <div className="relative mx-auto flex h-80 w-80 items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
              spinning ? "scale-105 opacity-100" : "opacity-60"
            }`}
            style={{
              background: weekendPromo
                ? "radial-gradient(circle, rgba(236,72,153,0.30) 0%, rgba(245,158,11,0.16) 35%, rgba(0,0,0,0) 72%)"
                : "radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(245,158,11,0.12) 35%, rgba(0,0,0,0) 72%)",
            }}
          />

          <div className="absolute top-0 z-30 h-0 w-0 border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]" />

          <div
            className={`absolute h-72 w-72 rounded-full border ${
              weekendPromo ? "border-pink-300/40" : "border-amber-300/30"
            } ${spinning ? "animate-ping" : ""}`}
          />

          <div
            className={`relative z-20 h-72 w-72 rounded-full border-8 ${
              weekendPromo ? "border-pink-500" : "border-amber-500"
            }`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4.2s cubic-bezier(0.15, 0.85, 0.2, 1)"
                : "none",
              background: wheelGradient,
              boxShadow: spinning
                ? weekendPromo
                  ? "0 0 40px rgba(236,72,153,0.45), inset 0 0 30px rgba(255,255,255,0.08)"
                  : "0 0 40px rgba(245,158,11,0.45), inset 0 0 30px rgba(255,255,255,0.08)"
                : weekendPromo
                ? "0 0 24px rgba(236,72,153,0.28), inset 0 0 20px rgba(255,255,255,0.04)"
                : "0 0 24px rgba(245,158,11,0.28), inset 0 0 20px rgba(255,255,255,0.04)",
            }}
          >
            {wheelItems.map((_, index) => (
              <div
                key={`divider-${index}`}
                className="absolute left-1/2 top-1/2 h-1/2 w-[2px] origin-bottom bg-white/20"
                style={{
                  transform: `translateX(-50%) rotate(${index * sliceAngle}deg)`,
                  transformOrigin: "center bottom",
                }}
              />
            ))}

            {wheelItems.map((item, index) => {
              const angle = index * sliceAngle + sliceAngle / 2;
              const isActive = activeSlice === index;

              return (
                <div
                  key={item.label}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                >
                  <div
                    className={`rounded-md px-2 py-1 text-center text-[11px] font-bold text-white transition-all duration-100 sm:text-xs ${
                      isActive ? "scale-110" : "scale-100"
                    }`}
                    style={{
                      transform: "translateY(-108px) rotate(90deg)",
                      textShadow: isActive
                        ? "0 0 12px rgba(255,255,255,0.95)"
                        : "0 1px 2px rgba(0,0,0,0.35)",
                      boxShadow: isActive
                        ? "0 0 18px rgba(255,255,255,0.28)"
                        : "none",
                      background: isActive
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              );
            })}

            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.18), rgba(255,255,255,0.03) 28%, rgba(255,255,255,0) 55%)",
              }}
            />

            <div className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white/20 bg-slate-950 shadow-lg">
              <div className="h-5 w-5 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className={`w-full rounded-xl py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
            weekendPromo
              ? "bg-pink-500 text-white hover:bg-pink-400"
              : "bg-amber-500 text-black hover:bg-amber-400"
          }`}
        >
          {spinning
            ? "Girando..."
            : canSpin
            ? weekendPromo
              ? "Girar roda premiada"
              : "Girar roda"
            : "Convide 1 amigo para ativar"}
        </button>

        {result && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-lg font-bold text-emerald-400">{result}</p>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <h2 className="text-sm font-bold text-amber-400">
            Histórico de prêmios
          </h2>

          {history.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">
              Nenhum giro registado.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((item: any) => (
                <div key={item.id} className="rounded-lg bg-slate-950/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {item.label}
                      </p>
                      {item.weekendPromo ? (
                        <p className="text-[10px] text-pink-300">
                          Fim de semana premiado
                        </p>
                      ) : null}
                    </div>
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