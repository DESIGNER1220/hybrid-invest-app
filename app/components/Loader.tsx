"use client";

export default function Loader({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-900/90 p-6 shadow-lg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-emerald-400 border-b-slate-700"></div>
        <p className="text-white font-semibold">{message}</p>
      </div>
    </div>
  );
}