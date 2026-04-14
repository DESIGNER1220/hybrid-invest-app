"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import {
  getSupportUsers,
  getUserProfile,
  sendSupportMessage,
  subscribeSupportMessages,
  type SupportMessage,
  type SupportUser,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  role?: string;
  phone?: string;
};

function formatDateTime(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "";
  return new Date(timestamp.seconds * 1000).toLocaleString("pt-MZ", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function ChatPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [supportUsers, setSupportUsers] = useState<SupportUser[]>([]);
  const [selectedThreadUid, setSelectedThreadUid] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const isAdmin = profile?.role === "admin";
  const activeThreadUid = isAdmin ? selectedThreadUid : uid;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setUid(user.uid);

        const userProfile = (await getUserProfile(user.uid)) as UserProfile | null;
        setProfile(userProfile);

        if (userProfile?.role === "admin") {
          const users = await getSupportUsers();
          setSupportUsers(users);

          if (users.length > 0) {
            setSelectedThreadUid(users[0].id);
          }
        } else {
          setSelectedThreadUid(user.uid);
        }
      } catch (error) {
        console.error("Erro ao carregar chat:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!activeThreadUid) return;

    const unsubscribe = subscribeSupportMessages(activeThreadUid, (data) => {
      setMessages(data);
    });

    return () => unsubscribe();
  }, [activeThreadUid]);

  const selectedSupportUser = useMemo(() => {
    return supportUsers.find((item) => item.id === selectedThreadUid) || null;
  }, [supportUsers, selectedThreadUid]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!uid || !activeThreadUid) return;
    if (!text.trim()) return;

    try {
      setSending(true);

      await sendSupportMessage({
        threadUid: activeThreadUid,
        senderUid: uid,
        senderRole: isAdmin ? "admin" : "user",
        text,
      });

      setText("");
    } catch (error: any) {
      alert(error?.message || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 pb-24 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <h1 className="text-xl font-bold">Chat online</h1>

          {!isAdmin ? (
            <p className="mt-1 text-sm text-slate-300">
              Número:{" "}
              <span className="font-semibold text-amber-400">
                {profile?.phone || "Sem número"}
              </span>
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-slate-400">
                Selecione o usuário para conversar
              </p>

              <select
                value={selectedThreadUid}
                onChange={(e) => setSelectedThreadUid(e.target.value)}
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none"
              >
                {supportUsers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.phone || item.email || item.id}
                  </option>
                ))}
              </select>

              {selectedSupportUser && (
                <p className="mt-2 text-sm text-slate-300">
                  Conversando com:{" "}
                  <span className="font-semibold text-amber-400">
                    {selectedSupportUser.phone ||
                      selectedSupportUser.email ||
                      selectedSupportUser.id}
                  </span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="h-[58vh] overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400">Sem mensagens ainda.</p>
            ) : (
              messages.map((item) => {
                const mine = item.senderUid === uid;

                return (
                  <div
                    key={item.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        mine
                          ? "bg-amber-500 text-black"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      {item.text ? <p className="text-sm">{item.text}</p> : null}

                      <p
                        className={`mt-2 text-[10px] ${
                          mine ? "text-black/70" : "text-slate-400"
                        }`}
                      >
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva sua mensagem..."
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-3 text-sm text-white outline-none"
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black disabled:opacity-70"
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>

      <BottomNav />
    </main>
  );
}