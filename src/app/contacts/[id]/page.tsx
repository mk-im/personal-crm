import { Suspense } from "react";

import { ContactCard } from "@/components/contact-card";

export default function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Загрузка карточки…</p>}>
      <ContactCard params={params} />
    </Suspense>
  );
}
