import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import Link from "next/link";

import { AppLogo } from "@/components/app-logo";
import { GROUPS_PAGE } from "@/lib/groups";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Личная CRM — люди, которых вы знаете",
  description:
    "Кто это, откуда знакомы, телефон, почта и о чём договорились. Заметка после разговора остаётся в карточке контакта.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full`}>
      <body className={`${manrope.className} flex min-h-full w-full flex-col bg-mist text-ink`}>
        <header className="w-full bg-brand px-5 py-5 text-white lg:px-10 lg:py-7">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
            <AppLogo />
            <Link
              href={GROUPS_PAGE.href}
              className="text-ui-14 font-semibold text-white hover:text-white/80 lg:text-ui-16"
            >
              {GROUPS_PAGE.label}
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
