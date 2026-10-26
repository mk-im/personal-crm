import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { listDueContacts } from "@/db/queries";
import { avatarTone, contactInitials } from "@/lib/contact-style";
import { KEEP_IN_TOUCH_LABELS, overdueDaysPhrase } from "@/lib/keep-in-touch";

export async function DueContacts() {
  const due = await listDueContacts();

  if (due.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Пора связаться"
      className="overflow-hidden rounded-r22 bg-white shadow-card lg:rounded-r26 lg:shadow-card-lg"
    >
      <h2 className="px-4 pt-3.5 pb-2 text-ui-18 font-semibold lg:px-5 lg:pt-4.5 lg:pb-2.5">Пора связаться</h2>
      <ul>
        {due.map((contact) => (
          <li key={contact.id} className="border-t border-divider">
            <Link
              href={`/contacts/${contact.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-mist lg:gap-3.5 lg:px-5 lg:py-3.5"
            >
              <Avatar initials={contactInitials(contact.name)} tone={avatarTone(contact.name)} />
              <span className="min-w-0">
                <span className="block text-ui-15 font-bold lg:text-ui-17">{contact.name}</span>
                <span className="mt-0.5 block text-ui-12 text-label lg:text-ui-14">
                  {KEEP_IN_TOUCH_LABELS[contact.keepInTouchFrequency]}
                  {" · "}
                  <span className="font-semibold text-ink">{overdueDaysPhrase(contact.overdueDays)}</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
