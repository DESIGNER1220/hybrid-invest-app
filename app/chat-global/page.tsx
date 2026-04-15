"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import {
  getUserProfile,
  sendGlobalChatMessage,
  subscribeGlobalChatMessages,
  type GlobalChatMessage,
} from "../services/authService";
import BottomNav from "../components/BottomNav";
import { Send, ShieldCheck, ArrowLeft, Paperclip, X } from "lucide-react";

type UserProfile = {
  role?: string;
};

function formatTime(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "";
  return new Date(timestamp.seconds * 1000).toLocaleTimeString("pt-MZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatGlobalPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setUid(user.uid);
        const profileData = await getUserProfile(user.uid);
        setProfile((profileData as UserProfile) || null);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    const unsub = subscribeGlobalChatMessages((data) => {
      setMessages(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isAdmin = useMemo(() => profile?.role === "admin", [profile]);

  async function handleSend() {
    const message = text.trim();

    if ((!message && !selectedImageDataUrl) || !uid || sending) return;

    try {
      setSending(true);

      await sendGlobalChatMessage({
        uid,
        text: message,
        imageDataUrl: selectedImageDataUrl,
      });

      setText("");
      setSelectedFileName("");
      setSelectedImageDataUrl("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      alert(error?.message || "Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      alert("Selecione apenas imagem JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 200 * 1024) {
      alert("A imagem deve ter no máximo 200 KB.");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setSelectedFileName(file.name);
      setSelectedImageDataUrl(base64);
    } catch {
      alert("Erro ao ler imagem.");
    }
  }

  function clearSelectedFile() {
    setSelectedFileName("");
    setSelectedImageDataUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-lg font-bold">Suporte</h1>
              <p className="text-[11px] text-slate-400">
                {isAdmin ? "Mensagem para todos" : "Chat global"}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
              Admin
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-md px-3 pt-3 pb-44">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
              Ainda não há mensagens.
            </div>
          ) : (
            messages.map((msg) => {
              const mine = msg.uid === uid;
              const adminMessage = msg.senderRole === "admin";

              return (
                <div
                  key={msg.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-lg ${
                      adminMessage
                        ? "border border-amber-500/20 bg-amber-500/10 text-white"
                        : mine
                          ? "bg-emerald-500 text-black"
                          : "border border-white/10 bg-slate-800 text-white"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
                        {adminMessage && (
                          <ShieldCheck size={12} className="text-amber-300" />
                        )}
                        <span
                          className={`text-[11px] font-bold ${
                            adminMessage
                              ? "text-amber-300"
                              : mine
                                ? "text-black"
                                : "text-cyan-300"
                          }`}
                        >
                          {adminMessage ? "Administrador" : msg.senderName}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] ${
                          mine ? "text-black/70" : "text-slate-400"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>

                    {!!msg.text && (
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    )}

                    {!!msg.imageDataUrl && (
                      <div className="mt-2 overflow-hidden rounded-xl">
                        <Image
                          src={msg.imageDataUrl}
                          alt="Imagem enviada"
                          width={320}
                          height={240}
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-white/10 bg-black/80 px-3 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          {selectedFileName && (
            <div className="mb-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-amber-200">
                  {selectedFileName}
                </span>

                <button
                  onClick={clearSelectedFile}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white"
                >
                  <X size={12} />
                </button>
              </div>

              {selectedImageDataUrl && (
                <div className="mt-2 overflow-hidden rounded-lg">
                  <Image
                    src={selectedImageDataUrl}
                    alt="Pré-visualização"
                    width={320}
                    height={200}
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handlePickFile}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-white transition hover:bg-slate-700"
              title="Anexar imagem"
            >
              <Paperclip size={18} />
            </button>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isAdmin
                  ? "Escreva uma mensagem para todos..."
                  : "Escreva a sua mensagem..."
              }
              className="flex-1 rounded-full border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />

            <button
              onClick={handleSend}
              disabled={(!text.trim() && !selectedImageDataUrl) || sending}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg transition hover:scale-105 disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}