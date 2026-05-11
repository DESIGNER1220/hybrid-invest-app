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

export default function DownloadAppButton({
  className = "",
}: DownloadAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneMode());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
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
    if (!deferredPrompt) {
      alert(
        "Para instalar o app, abra o menu do navegador e escolha a opção 'Adicionar à tela inicial'."
      );
      return;
    }

    await deferredPrompt.prompt();

    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      setInstalled(true);
    }

    setDeferredPrompt(null);
  }

  if (installed) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleInstallApp}
      className={`group inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-[11px] font-extrabold text-white shadow-xl backdrop-blur transition active:scale-95 ${className}`}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg">
        <span className="relative h-6 w-6 overflow-hidden">
          {/* Forma triangular estilo Google Play */}
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
  );
}