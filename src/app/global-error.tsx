"use client";

import { Manrope } from "next/font/google";

import { AppLogo } from "@/components/app-logo";
import { ErrorScreen } from "@/components/error-screen";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full`}>
      <body className={`${manrope.className} flex min-h-full w-full flex-col bg-mist text-ink`}>
        <header className="w-full bg-brand px-5 py-5 text-white lg:px-10 lg:py-7">
          <div className="mx-auto flex w-full max-w-3xl items-center">
            <AppLogo />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-6 lg:px-10 lg:py-10">
          <ErrorScreen
            onRetry={() => {
              reset();
              window.location.reload();
            }}
          />
        </main>
      </body>
    </html>
  );
}
