import Link from "next/link";
import { notFound } from "next/navigation";

import { NoteForm } from "@/components/note-form";
import { buttonVariants } from "@/components/ui/button";
import { getContact } from "@/db/queries";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap">{value?.trim() ? value : "не указано"}</dd>
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
      <div className="flex flex-col gap-3">
        <Link href="/" className={buttonVariants({ variant: "ghost", className: "w-fit px-0" })}>
          К списку
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{contact.name}</h1>
      </div>

      <dl className="flex flex-col gap-4 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <Field label="Откуда знакомы" value={contact.metThrough} />
        <Field label="Телефон" value={contact.phone} />
        <Field label="Почта" value={contact.email} />
        <Field label="О чём договорились" value={contact.agreement} />
      </dl>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Заметки</h2>
        <NoteForm contactId={contact.id} />
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Заметок пока нет</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
                <p className="whitespace-pre-wrap">{note.body}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {dateFormat.format(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
