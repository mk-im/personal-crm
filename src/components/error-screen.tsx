"use client";

import { CtaButton } from "@/components/cta-button";

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-r22 bg-white p-6 shadow-card lg:rounded-r26 lg:shadow-card-lg">
      <div className="flex flex-col gap-2">
        <h1 className="text-lead font-medium lg:text-lead-lg">Страница не открылась</h1>
        <p className="text-ui-14 text-muted lg:text-ui-16">Попробуйте обновить страницу.</p>
      </div>
      <CtaButton type="button" icon="↻" onClick={onRetry} className="w-full sm:w-auto">
        Обновить
      </CtaButton>
      <a href="/" className="w-fit text-ui-14 font-semibold text-label hover:text-ink">
        ← К списку
      </a>
    </div>
  );
}
