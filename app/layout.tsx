import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "./components/PWARegister";
import AppHeader from "./components/AppHeader";

export const metadata: Metadata = {
  title: "Hybrid Invest",
  description: "Hybrid Invest platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HYBR",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>
        <PWARegister />
        <AppHeader />
        {children}
      </body>
    </html>
  );
}