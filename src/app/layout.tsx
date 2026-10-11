import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Контакты",
  description: "Личная CRM: люди, которых я знаю",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-4">
            <Link href="/" className="text-base font-semibold">
              Контакты
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
