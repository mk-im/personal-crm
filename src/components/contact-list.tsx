import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { CtaLink } from "@/components/cta-link";
import { DueContacts } from "@/components/due-contacts";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listContacts, listDueContacts, listGroups, listMemberships } from "@/db/queries";
import { avatarTone, contactInitials } from "@/lib/contact-style";
import { buildHomeView, groupRowLabel } from "@/lib/groups";
import { requireUserId } from "@/lib/session";

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

export async function ContactList({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const userId = await requireUserId();
  const [contacts, groups, due] = await Promise.all([
    listContacts(userId, query),
    listGroups(userId),
    query ? Promise.resolve([]) : listDueContacts(userId),
  ]);
  const memberships = await listMemberships(
    userId,
    contacts.map((contact) => contact.id),
  );
  const view = buildHomeView({
    contacts,
    groups,
    memberships,
    query,
    hasDueContacts: due.length > 0,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lead font-medium lg:text-lead-lg">Контакты</h1>
          <p className="mt-1 text-ui-14 text-muted lg:text-ui-16">
            {query ? "Нашли" : "Всего"} {contactsLabel(view.count)}
          </p>
        </div>
        <CtaLink href="/contacts/new" icon="+">
          Добавить контакт
        </CtaLink>
      </div>

      <form
        action="/"
        className="flex flex-col gap-2 rounded-r22 bg-white p-3 shadow-card sm:flex-row sm:items-center lg:rounded-r26 lg:p-4 lg:shadow-card-lg"
      >
        <Label htmlFor="q" className="sr-only">
          Найти по имени
        </Label>
        <Input
          id="q"
          name="q"
          defaultValue={query}
          placeholder="Найти по имени"
          autoComplete="off"
          className="border-transparent bg-mist"
        />
        <div className="flex gap-2">
          <button type="submit" className={buttonVariants({ size: "lg" })}>
            Найти
          </button>
          {query ? (
            <Link href="/" className={buttonVariants({ variant: "ghost", size: "lg" })}>
              Показать всех
            </Link>
          ) : null}
        </div>
      </form>

      {view.showDueBlock ? <DueContacts /> : null}

      {view.sections.length === 0 ? (
        <p className="rounded-r22 bg-white px-4 py-10 text-center text-muted shadow-card lg:rounded-r26 lg:shadow-card-lg">
          {query ? "Никого не нашли по этому имени" : "Добавь первый контакт"}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {view.sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-2">
              <h2 className="text-ui-18 font-semibold">{section.title}</h2>
              <ul className="overflow-hidden rounded-r22 bg-white shadow-card lg:rounded-r26 lg:shadow-card-lg">
                {section.contacts.map((contact) => {
                  const groupsLabel = groupRowLabel(contact.groupNames);

                  return (
                    <li key={contact.id} className="border-b border-divider last:border-b-0">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-mist lg:gap-3.5 lg:px-5 lg:py-3.5"
                      >
                        <Avatar
                          initials={contactInitials(contact.name)}
                          tone={avatarTone(contact.name)}
                        />
                        <span className="min-w-0">
                          <span className="block text-ui-15 font-bold lg:text-ui-17">
                            {contact.name}
                          </span>
                          {contact.metThrough ? (
                            <span className="mt-0.5 block text-ui-12 text-label lg:text-ui-14">
                              {contact.metThrough}
                            </span>
                          ) : null}
                          {groupsLabel ? (
                            <span className="mt-0.5 block text-ui-12 text-label lg:text-ui-14">
                              {groupsLabel}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
