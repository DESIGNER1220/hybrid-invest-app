import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-amber-400">
              Hybrid Invest
            </p>

            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-6xl">
              Invista com uma plataforma moderna, simples e profissional.
            </h1>

            <p className="mb-8 max-w-xl text-base text-slate-300 md:text-lg">
              Crie a sua conta, acompanhe saldo, convites, activos e histórico
              num ambiente seguro, rápido e pensado para crescer.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-2xl bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Entrar
              </Link>

              <Link
                href="/register"
                className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Criar conta
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">Segurança</p>
                <h3 className="mt-2 text-lg font-semibold">Firebase Auth</h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">Bónus</p>
                <h3 className="mt-2 text-lg font-semibold">Sistema Referral</h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">Acesso</p>
                <h3 className="mt-2 text-lg font-semibold">Web + App</h3>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm text-slate-300">Painel de pré-visualização</span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                Online
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Saldo disponível</p>
                <h3 className="mt-2 text-3xl font-bold">$0.00</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-900/70 p-5">
                  <p className="text-sm text-slate-400">Activos</p>
                  <h3 className="mt-2 text-2xl font-bold">0</h3>
                </div>

                <div className="rounded-2xl bg-slate-900/70 p-5">
                  <p className="text-sm text-slate-400">Amigos</p>
                  <h3 className="mt-2 text-2xl font-bold">0</h3>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Histórico</p>
                <p className="mt-2 text-sm text-slate-300">
                  Acompanhe movimentos, ganhos e evolução da sua conta com um
                  painel limpo e organizado.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                Comece agora e tenha acesso ao sistema completo com login,
                convites e dashboard.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}