import type { Metadata } from "next";
import "./globals.css";
import FloatingChatButton from "./components/FloatingChatButton";

export const metadata: Metadata = {
  title: "Hybrid Invest",
  description: "Hybrid Invest App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body>
        {children}
        <FloatingChatButton />
      </body>
    </html>
  );
}