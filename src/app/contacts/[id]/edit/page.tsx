import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ContactForm } from "@/components/contact-form";
import { RefreshOnMount } from "@/components/refresh-on-mount";
import { getContact } from "@/db/queries";

function contactFormKey(contact: {
  id: number;
  name: string;
  metThrough: string | null;
  phone: string | null;
  email: string | null;
  agreement: string | null;
  keepInTouchFrequency: string | null;
}) {
  return [
    contact.id,
    contact.name,
    contact.metThrough ?? "",
    contact.phone ?? "",
    contact.email ?? "",
    contact.agreement ?? "",
    contact.keepInTouchFrequency ?? "",
  ].join("|");
}

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
      <RefreshOnMount />
      <ContactForm key={contactFormKey(result.contact)} contact={result.contact} />
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
