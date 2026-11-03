import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ContactForm } from "@/components/contact-form";
import { RefreshOnMount } from "@/components/refresh-on-mount";
import { getContact, listGroups } from "@/db/queries";

function contactFormKey(contact: {
  id: number;
  name: string;
  metThrough: string | null;
  phone: string | null;
  email: string | null;
  agreement: string | null;
  keepInTouchFrequency: string | null;
  groupIds: number[];
}) {
  return [
    contact.id,
    contact.name,
    contact.metThrough ?? "",
    contact.phone ?? "",
    contact.email ?? "",
    contact.agreement ?? "",
    contact.keepInTouchFrequency ?? "",
    contact.groupIds.join(","),
  ].join("|");
}

async function EditContact({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contactId = Number(id);

  if (!Number.isInteger(contactId) || contactId <= 0) {
    notFound();
  }

  const [result, groups] = await Promise.all([getContact(contactId), listGroups()]);

  if (!result) {
    notFound();
  }

  const contact = {
    ...result.contact,
    groupIds: result.groups.map((group) => group.id),
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/contacts/${contact.id}`}
        className="w-fit text-ui-14 font-semibold text-label hover:text-ink"
      >
        ← К карточке
      </Link>
      <h1 className="text-lead font-medium lg:text-lead-lg">Изменить контакт</h1>
      <RefreshOnMount />
      <ContactForm key={contactFormKey(contact)} contact={contact} groups={groups} />
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
