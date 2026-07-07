import type { Metadata } from "next";
import {Barlow, JetBrains_Mono} from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: '--font-barlow',
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"]
});

const jet = JetBrains_Mono({
  variable: '--font-jet',
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "Feraboli - Configuratore",
  description: "Configuratore di stalle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${jet.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
