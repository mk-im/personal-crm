import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listContacts } from "@/db/queries";

function contactsLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} контакт`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} контакта`;
  }

  return `${count} контактов`;
}

export async function ContactList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const contacts = await listContacts(query);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Контакты</h1>
          <p className="text-sm text-muted-foreground">
            {query ? "Нашли" : "Всего"} {contactsLabel(contacts.length)}
          </p>
        </div>
        <Link href="/contacts/new" className={buttonVariants()}>
          Добавить контакт
        </Link>
      </div>

      <form action="/" className="flex flex-col gap-2 sm:flex-row">
        <Label htmlFor="q" className="sr-only">
          Найти по имени
        </Label>
        <Input
          id="q"
          name="q"
          defaultValue={query}
          placeholder="Найти по имени"
          autoComplete="off"
        />
        <div className="flex gap-2">
          <button type="submit" className={buttonVariants({ variant: "secondary" })}>
            Найти
          </button>
          {query ? (
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              Показать всех
            </Link>
          ) : null}
        </div>
      </form>

      {contacts.length === 0 ? (
        <p className="rounded-xl bg-card px-4 py-8 text-center text-muted-foreground ring-1 ring-foreground/10">
          {query ? "Никого не нашли по этому имени" : "Пока нет контактов"}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          {contacts.map((contact) => (
            <li key={contact.id} className="border-b last:border-b-0">
              <Link
                href={`/contacts/${contact.id}`}
                className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted"
              >
                <span className="font-medium">{contact.name}</span>
                {contact.metThrough ? (
                  <span className="text-sm text-muted-foreground">{contact.metThrough}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
