import { Suspense } from "react";

import { ContactList } from "@/components/contact-list";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Загрузка контактов…</p>}>
      <ContactList searchParams={searchParams} />
    </Suspense>
  );
}
