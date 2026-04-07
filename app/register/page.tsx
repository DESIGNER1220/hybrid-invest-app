import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

interface RegisterPageProps {
  searchParams?: {
    ref?: string;
  };
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <RegisterForm initialReferral={searchParams?.ref ?? null} />
    </Suspense>
  );
}
