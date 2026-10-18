import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/avatar";
import { NoteForm } from "@/components/note-form";
import { getContact } from "@/db/queries";
import { avatarTone, contactInitials } from "@/lib/contact-style";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

function Field({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  return (
    <div
      className={
        wide
          ? "rounded-r14 border border-note-line bg-note px-3 py-2.5 sm:col-span-2 lg:rounded-r16 lg:px-4 lg:py-3.5"
          : "rounded-r14 bg-mist px-3 py-2.5 lg:rounded-r16 lg:px-4 lg:py-3.5"
      }
    >
      <dt className={`mb-0.75 text-ui-11 font-medium lg:mb-1 lg:text-ui-12 ${wide ? "text-blue-1" : "text-muted"}`}>
        {label}
      </dt>
      <dd className="whitespace-pre-wrap text-ui-14 font-semibold lg:text-ui-16">{value?.trim() ? value : "не указано"}</dd>
    </div>
  );
}

export async function ContactCard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contactId = Number(id);

  if (!Number.isInteger(contactId) || contactId <= 0) {
    notFound();
  }

  const result = await getContact(contactId);

  if (!result) {
    notFound();
  }

  const { contact, notes } = result;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="w-fit text-ui-14 font-semibold text-label hover:text-ink">
        ← К списку
      </Link>

      <section className="rounded-r22 bg-white p-4.5 shadow-card lg:rounded-r26 lg:p-6.5 lg:shadow-card-lg">
        <div className="flex items-center gap-3 border-b border-divider pb-3.5 lg:gap-4 lg:pb-4.5">
          <Avatar
            initials={contactInitials(contact.name)}
            tone={avatarTone(contact.name)}
            className="size-13 text-ui-17 lg:size-16 lg:text-ui-20"
          />
          <h1 className="text-ui-18 font-bold lg:text-ui-22">{contact.name}</h1>
        </div>
        <dl className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:mt-4.5 lg:gap-2.5">
          <Field label="Телефон" value={contact.phone} />
          <Field label="Почта" value={contact.email} />
          <Field label="Откуда знакомы" value={contact.metThrough} wide />
          <Field label="О чём договорились" value={contact.agreement} wide />
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-ui-18 font-semibold">Заметки</h2>
        <NoteForm contactId={contact.id} />
        {notes.length === 0 ? (
          <p className="text-ui-14 text-muted">Заметок пока нет</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-r14 bg-mist px-3.5 py-3 lg:rounded-r16 lg:px-4 lg:py-3.5">
                <p className="mb-1 text-ui-11 font-medium text-blue-1 lg:text-ui-12">Заметка</p>
                <p className="whitespace-pre-wrap text-ui-13 leading-[1.4] lg:text-ui-15">{note.body}</p>
                <p className="mt-2 text-ui-12 text-label lg:text-ui-14">{dateFormat.format(note.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
