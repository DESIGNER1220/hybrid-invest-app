import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hybrid Invest",
  description: "Plataforma de investimento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}