"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type DownloadAppButtonProps = {
  className?: string;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosDevice() {
  if (typeof window === "undefined") return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function DownloadAppButton({
  className = "",
}: DownloadAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneMode());
    setIsIos(isIosDevice());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowHelp(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallApp() {
    if (installed) return;

    if (!deferredPrompt) {
      setShowHelp(true);
      return;
    }

    try {
      await deferredPrompt.prompt();

      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setInstalled(true);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error("Erro ao instalar app:", error);
      setShowHelp(true);
    }
  }

  if (installed) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallApp}
        className={`group inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-[11px] font-extrabold text-white shadow-xl backdrop-blur transition hover:scale-[1.02] active:scale-95 ${className}`}
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg">
          <span className="relative h-6 w-6 overflow-hidden">
            <span
              className="absolute inset-0"
              style={{
                clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                background:
                  "linear-gradient(90deg, #00A8E8 0%, #34A853 40%, #FBBC05 70%, #EA4335 100%)",
              }}
            />

            <span
              className="absolute left-0 top-0 h-3 w-4"
              style={{
                clipPath: "polygon(0 0, 100% 100%, 0 100%)",
                background: "#00A8E8",
              }}
            />

            <span
              className="absolute bottom-0 left-0 h-3 w-4"
              style={{
                clipPath: "polygon(0 0, 100% 0, 0 100%)",
                background: "#1A73E8",
              }}
            />

            <span
              className="absolute right-0 top-[6px] h-3 w-4"
              style={{
                clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                background: "#FBBC05",
              }}
            />

            <span
              className="absolute right-[2px] top-[9px] h-2 w-3"
              style={{
                clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                background: "#EA4335",
              }}
            />
          </span>
        </span>

        <span className="leading-tight">
          <span className="block text-[9px] font-semibold text-emerald-300">
            Baixar agora
          </span>
          <span className="block text-[11px] font-black">Instalar App</span>
        </span>
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-slate-900 p-4 text-center text-white shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <span
                className="h-8 w-8"
                style={{
                  clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                  background:
                    "linear-gradient(90deg, #00A8E8 0%, #34A853 40%, #FBBC05 70%, #EA4335 100%)",
                }}
              />
            </div>

            <h3 className="text-sm font-black text-emerald-300">
              Instalar Aplicativo
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {isIos
                ? "No iPhone, toque no botão de partilhar do Safari e escolha “Adicionar à Tela de Início”."
                : "Se a instalação automática não aparecer, abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”."}
            </p>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full rounded-xl bg-emerald-500 py-2 text-xs font-black text-black"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}