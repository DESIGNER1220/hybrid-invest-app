"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Pencil, RotateCcw, Save, X } from "lucide-react";

type Tool = "line" | "arrow";

type Point = {
  x: number;
  y: number;
};

type Props = {
  imageDataUrl: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
};

export default function ImageAnnotator({
  imageDataUrl,
  onClose,
  onSave,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<Tool>("arrow");
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const maxWidth = Math.min(window.innerWidth - 32, 900);
      const ratio = img.width / img.height;

      let width = maxWidth;
      let height = width / ratio;

      const maxHeight = window.innerHeight - 180;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      setHistory([canvas.toDataURL("image/jpeg", 0.92)]);
    };

    img.src = imageDataUrl;
  }, [imageDataUrl]);

  function getCanvasPoint(clientX: number, clientY: number): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function drawShape(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    selectedTool: Tool
  ) {
    ctx.strokeStyle = "#ef4444";
    ctx.fillStyle = "#ef4444";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (selectedTool === "line") {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      return;
    }

    const headLength = 16;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(to.x, to.y);
    ctx.fill();
  }

  function redrawFromDataUrl(
    dataUrl: string,
    preview?: { from: Point; to: Point; tool: Tool }
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (preview) {
        drawShape(ctx, preview.from, preview.to, preview.tool);
      }
    };
    img.src = dataUrl;
  }

  function beginDraw(x: number, y: number) {
    const point = getCanvasPoint(x, y);
    if (!point) return;

    setDrawing(true);
    setStartPoint(point);
  }

  function moveDraw(x: number, y: number) {
    if (!drawing || !startPoint || history.length === 0) return;

    const point = getCanvasPoint(x, y);
    if (!point) return;

    redrawFromDataUrl(history[history.length - 1], {
      from: startPoint,
      to: point,
      tool,
    });
  }

  function endDraw(x: number, y: number) {
    if (!drawing || !startPoint) return;

    const point = getCanvasPoint(x, y);
    if (!point) {
      setDrawing(false);
      setStartPoint(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    redrawFromDataUrl(history[history.length - 1], {
      from: startPoint,
      to: point,
      tool,
    });

    setTimeout(() => {
      const finalData = canvas.toDataURL("image/jpeg", 0.92);
      setHistory((prev) => [...prev, finalData]);
    }, 0);

    setDrawing(false);
    setStartPoint(null);
  }

  function handleUndoAll() {
    if (!history.length) return;
    redrawFromDataUrl(history[0]);
    setHistory((prev) => prev.slice(0, 1));
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/jpeg", 0.92));
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 p-3 text-white">
      <div className="mx-auto flex h-full max-w-5xl flex-col">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Editar imagem</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTool("arrow")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
              tool === "arrow" ? "bg-emerald-500 text-black" : "bg-white/10"
            }`}
          >
            <ArrowRight size={16} />
            Seta
          </button>

          <button
            type="button"
            onClick={() => setTool("line")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
              tool === "line" ? "bg-emerald-500 text-black" : "bg-white/10"
            }`}
          >
            <Pencil size={16} />
            Linha
          </button>

          <button
            type="button"
            onClick={handleUndoAll}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-black"
          >
            <RotateCcw size={16} />
            Limpar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-black"
          >
            <Save size={16} />
            Salvar
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto rounded-2xl bg-white/5 p-2">
          <canvas
            ref={canvasRef}
            className="max-w-full touch-none rounded-xl bg-black"
            onMouseDown={(e) => beginDraw(e.clientX, e.clientY)}
            onMouseMove={(e) => moveDraw(e.clientX, e.clientY)}
            onMouseUp={(e) => endDraw(e.clientX, e.clientY)}
            onMouseLeave={() => {
              setDrawing(false);
              setStartPoint(null);
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              beginDraw(touch.clientX, touch.clientY);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              moveDraw(touch.clientX, touch.clientY);
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              if (!touch) return;
              endDraw(touch.clientX, touch.clientY);
            }}
          />
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Escolha seta ou linha, arraste sobre a imagem e depois clique em salvar.
        </p>
      </div>
    </div>
  );
}