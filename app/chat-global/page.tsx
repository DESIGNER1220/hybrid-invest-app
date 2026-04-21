"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Send,
  Undo2,
  Trash2,
  Pencil,
  MoveRight,
  X,
} from "lucide-react";

import { auth } from "../lib/firebase";
import {
  sendGlobalChatMessage,
  subscribeGlobalChatMessages,
  type GlobalChatMessage,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

type Point = {
  x: number;
  y: number;
};

type Annotation =
  | {
      id: string;
      type: "line";
      start: Point;
      end: Point;
      color: string;
      width: number;
    }
  | {
      id: string;
      type: "arrow";
      start: Point;
      end: Point;
      color: string;
      width: number;
    };

function formatTime(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "--:--";

  return new Date(timestamp.seconds * 1000).toLocaleTimeString("pt-MZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Erro ao ler imagem."));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Erro ao abrir imagem."));
    img.src = src;
  });
}

async function compressImageToUnder1MB(file: File): Promise<File> {
  const maxBytes = 1024 * 1024;

  if (file.size <= maxBytes) return file;

  const imageUrl = await fileToDataUrl(file);
  const img = await loadImage(imageUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível processar a imagem.");
  }

  let width = img.width;
  let height = img.height;
  let quality = 0.9;

  const maxDimension = 1280;

  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height >= width && height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(img, 0, 0, width, height);

  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );

  while (blob && blob.size > maxBytes && quality > 0.3) {
    quality -= 0.1;
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
  }

  while (blob && blob.size > maxBytes && width > 400 && height > 400) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
  }

  if (!blob) {
    throw new Error("Falha ao comprimir a imagem.");
  }

  if (blob.size > maxBytes) {
    throw new Error("Não foi possível reduzir a imagem para até 1MB.");
  }

  return new File([blob], `chat-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  width: number
) {
  const headLength = 16;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  width: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function drawAnnotation(ctx: CanvasRenderingContext2D, item: Annotation) {
  if (item.type === "line") {
    drawLine(ctx, item.start, item.end, item.color, item.width);
    return;
  }

  drawArrow(ctx, item.start, item.end, item.color, item.width);
}

function getRelativePoint(
  e:
    | React.MouseEvent<HTMLCanvasElement>
    | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();

  const clientX =
    "touches" in e
      ? (e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0)
      : e.clientX;

  const clientY =
    "touches" in e
      ? (e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0)
      : e.clientY;

  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

export default function ChatGlobalPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMessageIdRef = useRef<string>("");

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState("");

  const [tool, setTool] = useState<"line" | "arrow">("arrow");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [draftAnnotation, setDraftAnnotation] = useState<Annotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  const [openedImage, setOpenedImage] = useState("");
  const [inAppNotification, setInAppNotification] = useState("");

  const annotationColor = "#22c55e";
  const annotationWidth = 6;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
      setLoading(false);
    });

    const unsubMessages = subscribeGlobalChatMessages((data) => {
      setMessages(data);
    });

    return () => {
      unsubAuth();
      unsubMessages();
    };
  }, [router]);

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.id) return;

    if (!lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessage.id;
      return;
    }

    if (lastMessage.id === lastMessageIdRef.current) return;

    const isFromAnotherUser = lastMessage.uid !== uid;

    if (isFromAnotherUser) {
      setInAppNotification(
        lastMessage.text?.trim()
          ? `${lastMessage.senderName}: ${lastMessage.text}`
          : `${lastMessage.senderName} enviou uma imagem.`
      );
    }

    lastMessageIdRef.current = lastMessage.id;
  }, [messages, uid]);

  useEffect(() => {
    if (!inAppNotification) return;

    const timer = setTimeout(() => {
      setInAppNotification("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [inAppNotification]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let active = true;

    async function renderCanvas() {
      if (!selectedImageDataUrl || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = await loadImage(selectedImageDataUrl);
      if (!active) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      annotations.forEach((item) => drawAnnotation(ctx, item));
      if (draftAnnotation) {
        drawAnnotation(ctx, draftAnnotation);
      }
    }

    renderCanvas();

    return () => {
      active = false;
    };
  }, [selectedImageDataUrl, annotations, draftAnnotation]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenedImage("");
      }
    }

    if (openedImage) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [openedImage]);

  const orderedMessages = useMemo(() => messages, [messages]);

  async function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] || null;
    setErrorMsg("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Selecione apenas imagens.");
      return;
    }

    try {
      const compressed = await compressImageToUnder1MB(file);
      const dataUrl = await fileToDataUrl(compressed);

      setSelectedImage(compressed);
      setSelectedImageName(file.name);
      setSelectedImageDataUrl(dataUrl);
      setAnnotations([]);
      setDraftAnnotation(null);
      setStartPoint(null);
      setIsDrawing(false);
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao processar imagem.");
    }

    e.target.value = "";
  }

  function clearSelectedImage() {
    setSelectedImage(null);
    setSelectedImageName("");
    setSelectedImageDataUrl("");
    setAnnotations([]);
    setDraftAnnotation(null);
    setStartPoint(null);
    setIsDrawing(false);
  }

  function undoAnnotation() {
    setAnnotations((prev) => prev.slice(0, -1));
  }

  function clearAnnotations() {
    setAnnotations([]);
    setDraftAnnotation(null);
  }

  function beginDraw(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    if (!canvasRef.current || !selectedImageDataUrl) return;

    const point = getRelativePoint(e, canvasRef.current);
    setStartPoint(point);
    setIsDrawing(true);
  }

  function moveDraw(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    if (!isDrawing || !startPoint || !canvasRef.current) return;

    const point = getRelativePoint(e, canvasRef.current);

    setDraftAnnotation({
      id: `${Date.now()}-draft`,
      type: tool,
      start: startPoint,
      end: point,
      color: annotationColor,
      width: annotationWidth,
    });
  }

  function endDraw(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    if (!isDrawing || !startPoint || !canvasRef.current) return;

    const point = getRelativePoint(e, canvasRef.current);

    const finalAnnotation: Annotation = {
      id: `${Date.now()}`,
      type: tool,
      start: startPoint,
      end: point,
      color: annotationColor,
      width: annotationWidth,
    };

    setAnnotations((prev) => [...prev, finalAnnotation]);
    setDraftAnnotation(null);
    setStartPoint(null);
    setIsDrawing(false);
  }

  async function exportAnnotatedImage(): Promise<File | null> {
    if (!selectedImageDataUrl || !canvasRef.current) return selectedImage;

    const canvas = canvasRef.current;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );

    if (!blob) {
      throw new Error("Não foi possível gerar a imagem anotada.");
    }

    const maxBytes = 1024 * 1024;
    if (blob.size > maxBytes) {
      throw new Error(
        "A imagem anotada ficou acima de 1MB. Reduza as marcações ou use outra imagem."
      );
    }

    return new File([blob], `annotated-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
  }

  async function handleSend() {
    if (!uid) {
      setErrorMsg("Utilizador não autenticado.");
      return;
    }

    if (!text.trim() && !selectedImage) {
      setErrorMsg("Escreva uma mensagem ou escolha uma imagem.");
      return;
    }

    try {
      setSending(true);
      setErrorMsg("");

      const finalImage = await exportAnnotatedImage();

      await sendGlobalChatMessage({
        uid,
        text,
        imageFile: finalImage,
      });

      setText("");
      clearSelectedImage();
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex h-[calc(100vh-80px)] max-w-sm flex-col">
        <div className="border-b border-white/10 bg-black px-3 pt-3 pb-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <h1 className="text-lg font-bold">Chat Global</h1>
            <p className="mt-1 text-xs text-slate-400">
              Converse com todos os membros da plataforma.
            </p>
          </div>
        </div>

        {inAppNotification ? (
          <div className="px-3 pt-3">
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
              <span className="line-clamp-2">{inAppNotification}</span>
              <button
                type="button"
                onClick={() => setInAppNotification("")}
                className="rounded-full bg-black/20 p-1 text-white"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {messages.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-4 text-center text-sm text-slate-400">
              Ainda não há mensagens no chat global.
            </div>
          ) : (
            <div className="space-y-3">
              {orderedMessages.map((msg) => {
                const isOwnMessage = msg.uid === uid;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow ${
                        isOwnMessage
                          ? "bg-cyan-500 text-black"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span
                          className={`text-[11px] font-bold ${
                            isOwnMessage ? "text-black/70" : "text-cyan-300"
                          }`}
                        >
                          {msg.senderName}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isOwnMessage ? "text-black/60" : "text-slate-500"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>

                      {msg.text ? (
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {msg.text}
                        </p>
                      ) : null}

                      {msg.imageDataUrl ? (
                        <button
                          type="button"
                          onClick={() => setOpenedImage(msg.imageDataUrl || "")}
                          className="mt-2 block w-full"
                        >
                          <img
                            src={msg.imageDataUrl}
                            alt="Imagem enviada"
                            className="max-h-80 w-full rounded-xl object-contain transition hover:opacity-90"
                          />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-black px-3 py-3">
          <div className="rounded-3xl border border-fuchsia-500/30 bg-[#070b18] p-4 shadow-xl">
            <p className="mb-3 text-sm font-bold text-fuchsia-400">
              Chat Global
            </p>

            {selectedImage ? (
              <div className="mb-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-emerald-300">
                      Imagem selecionada: {selectedImageName || "imagem"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Use linha ou seta para indicar o ponto importante.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setTool("line")}
                    className={`flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition ${
                      tool === "line"
                        ? "bg-cyan-500 text-black shadow-lg"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <Pencil size={16} />
                    Linha
                  </button>

                  <button
                    type="button"
                    onClick={() => setTool("arrow")}
                    className={`flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition ${
                      tool === "arrow"
                        ? "bg-fuchsia-500 text-white shadow-lg"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <MoveRight size={16} />
                    Seta
                  </button>

                  <button
                    type="button"
                    onClick={undoAnnotation}
                    className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    <Undo2 size={16} />
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={clearAnnotations}
                    className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    <Trash2 size={16} />
                    Limpar
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={beginDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={() => {
                      setDraftAnnotation(null);
                      setIsDrawing(false);
                      setStartPoint(null);
                    }}
                    onTouchStart={beginDraw}
                    onTouchMove={moveDraw}
                    onTouchEnd={endDraw}
                    className="max-h-64 w-full touch-none object-contain"
                  />
                </div>
              </div>
            ) : null}

            {errorMsg ? (
              <div className="mb-3 rounded-2xl border border-red-400 bg-red-500/20 px-3 py-3 text-sm text-red-300">
                {errorMsg}
              </div>
            ) : null}

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva a sua mensagem..."
              rows={2}
              className="mb-3 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-h-[54px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-bold text-black shadow-lg transition hover:bg-emerald-400 active:scale-[0.98]">
                <ImagePlus size={18} />
                Escolher imagem
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-fuchsia-500 px-4 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-fuchsia-400 active:scale-[0.98] disabled:opacity-60"
              >
                <Send size={18} />
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {openedImage ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setOpenedImage("")}
        >
          <button
            type="button"
            onClick={() => setOpenedImage("")}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <X size={20} />
          </button>

          <div
            className="max-h-full max-w-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={openedImage}
              alt="Imagem ampliada"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}

      <BottomNav />
    </main>
  );
}