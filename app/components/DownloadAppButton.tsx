"use client";

type DownloadAppButtonProps = {
  className?: string;
  label?: string;
};

export default function DownloadAppButton({
  className = "",
  label = "Instalar App",
}: DownloadAppButtonProps) {
  return (
    <a
      href="/app/hybrid-invest.apk"
      download="Hybrid-Invest.apk"
      className={`group mx-auto flex h-[48px] w-full max-w-[100px] items-center justify-center gap-3 rounded-[14px] border border-white/15 bg-[#111827] px-4 text-white shadow-lg transition duration-300 hover:scale-[1.02] hover:bg-black active:scale-[0.98] ${className}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
        <svg
          width="22"
          height="22"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M8 6L29 24L8 42V6Z" fill="#4285F4" />
          <path d="M29 24L36 18L43 22C45 23.1 45 24.9 43 26L36 30L29 24Z" fill="#FBBC05" />
          <path d="M8 6L36 18L29 24L8 6Z" fill="#34A853" />
          <path d="M8 42L29 24L36 30L8 42Z" fill="#EA4335" />
        </svg>
      </div>

      <div className="flex flex-col items-start leading-none">
        <span className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-300">
          Baixar agora
        </span>

        <span className="mt-1 text-[6px] font-extrabold tracking-wide text-green">
          {label}
        </span>
      </div>
    </a>
  );
}