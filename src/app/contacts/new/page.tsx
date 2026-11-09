import Link from "next/link";
import { Suspense } from "react";

import { ContactForm } from "@/components/contact-form";
import { listGroups } from "@/db/queries";
import { requireUserId } from "@/lib/session";

async function NewContactContent() {
  const groups = await listGroups(await requireUserId());

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="w-fit text-ui-14 font-semibold text-label hover:text-ink">
        ← К списку
      </Link>
      <h1 className="text-lead font-medium lg:text-lead-lg">Новый контакт</h1>
      <ContactForm groups={groups} />
    </div>
  );
}

export default function NewContactPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Загрузка формы…</p>}>
      <NewContactContent />
    </Suspense>
  );
}
