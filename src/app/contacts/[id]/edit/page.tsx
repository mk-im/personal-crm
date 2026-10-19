import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ContactForm } from "@/components/contact-form";
import { getContact } from "@/db/queries";

async function EditContact({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contactId = Number(id);

  if (!Number.isInteger(contactId) || contactId <= 0) {
    notFound();
  }

  const result = await getContact(contactId);

  if (!result) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/contacts/${result.contact.id}`}
        className="w-fit text-ui-14 font-semibold text-label hover:text-ink"
      >
        ← К карточке
      </Link>
      <h1 className="text-lead font-medium lg:text-lead-lg">Изменить контакт</h1>
      <ContactForm contact={result.contact} />
    </div>
  );
}

export default function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Загрузка карточки…</p>}>
      <EditContact params={params} />
    </Suspense>
  );
}
