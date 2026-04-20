"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import DownloadAppButton from "../components/DownloadAppButton";

export default function BaixarAppPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 py-6 text-white">
      <div className="mx-auto max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400">
              Hybrid Invest
            </p>
            <h1 className="text-lg font-bold">Baixar App</h1>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/15">
              <Smartphone size={38} className="text-emerald-400" />
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold text-white">
            App Android
          </h2>

          <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">
            Baixe e instale o aplicativo oficial da{" "}
            <span className="font-bold text-amber-400">Hybrid Invest</span>.
          </p>

          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-400"
              />
              <p className="text-xs leading-relaxed text-slate-200">
                Faça o download apenas pelo nosso site oficial:
                <br />
                <span className="font-bold text-white">
                  www.hybrunimoz.mom
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5">
            <DownloadAppButton />
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-bold text-white">Como instalar</p>

            <div className="space-y-2 text-xs leading-relaxed text-slate-300">
              <p>1. Clique em “Instalar App”.</p>
              <p>2. Aguarde o APK terminar de baixar.</p>
              <p>3. Abra o ficheiro baixado no telefone.</p>
              <p>4. Autorize instalar apps desta fonte, se o Android pedir.</p>
              <p>5. Termine a instalação e abra a app.</p>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-cyan-400"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}