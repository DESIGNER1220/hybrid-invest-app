import Link from "next/link";

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>HYBRID INVEST</h1>

      <div style={{ marginTop: 20 }}>
        <Link href="/login">Login</Link>
        <br />
        <Link href="/register">Criar Conta</Link>
      </div>
    </div>
  );
}