import RegisterForm from "./RegisterForm";

type RegisterPageProps = {
  searchParams?: Promise<{
    ref?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const refFromUrl = params?.ref ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 py-6 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400">
            Hybrid Invest
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Criar Conta</h1>
        </div>

        <RegisterForm initialReferral={refFromUrl} />
      </div>
    </main>
  );
}