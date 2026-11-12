import { and, asc, desc, eq, ilike, inArray, isNotNull, sql } from "drizzle-orm";

import { moscowToday, upcomingBirthdays, type UpcomingBirthday } from "@/lib/birthdays";
import { dueContacts, isKeepInTouchFrequency, type DueContact } from "@/lib/keep-in-touch";

import { db } from "./index";
import { contactGroups, contacts, groups, notes } from "./schema";

function likePattern(query: string) {
  const escaped = query.replace(/[\\%_]/g, "\\$&");
  return `%${escaped}%`;
}

// Every query takes the owner from the session; nothing here reads the tables whole.
export async function listContacts(userId: string, query: string) {
  const nameFilter = query ? ilike(contacts.name, likePattern(query)) : undefined;

  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      metThrough: contacts.metThrough,
    })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), nameFilter))
    .orderBy(asc(contacts.name));
}

export async function listGroups(userId: string) {
  const rows = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.userId, userId));

  return rows.sort((left, right) => left.name.localeCompare(right.name, "ru"));
}

export async function listMemberships(userId: string, contactIds: number[]) {
  if (contactIds.length === 0) {
    return [];
  }

  return db
    .select({
      contactId: contactGroups.contactId,
      groupId: contactGroups.groupId,
    })
    .from(contactGroups)
    .innerJoin(contacts, eq(contactGroups.contactId, contacts.id))
    .where(and(eq(contacts.userId, userId), inArray(contactGroups.contactId, contactIds)));
}

export type { DueContact, UpcomingBirthday };

export async function listUpcomingBirthdays(
  userId: string,
  today = moscowToday(),
): Promise<UpcomingBirthday[]> {
  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      birthDate: contacts.birthDate,
    })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), isNotNull(contacts.birthDate)));

  return upcomingBirthdays(
    rows.flatMap((row) =>
      row.birthDate ? [{ id: row.id, name: row.name, birthDate: row.birthDate }] : [],
    ),
    today,
  );
}

export async function listDueContacts(userId: string): Promise<DueContact[]> {
  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      frequency: contacts.keepInTouchFrequency,
      frequencySetAt: contacts.keepInTouchSetAt,
      latestNoteAt: sql<Date | string | null>`(
        select max(${notes.createdAt}) from ${notes} where ${notes.contactId} = ${contacts.id}
      )`,
    })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), isNotNull(contacts.keepInTouchFrequency)));

  return dueContacts(
    rows.flatMap((row) => {
      if (!row.frequency || !isKeepInTouchFrequency(row.frequency)) {
        return [];
      }

      return [
        {
          id: row.id,
          name: row.name,
          frequency: row.frequency,
          frequencySetAt: asDate(row.frequencySetAt),
          latestNoteAt: asDate(row.latestNoteAt),
        },
      ];
    }),
    new Date(),
  );
}

function asDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Someone else's id and a missing id both come back as null.
export async function getContact(userId: string, id: number) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.id, id)))
    .limit(1);

  if (!contact) {
    return null;
  }

  const contactNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.contactId, id))
    .orderBy(desc(notes.createdAt));

  const contactGroupRows = await db
    .select({ id: groups.id, name: groups.name })
    .from(contactGroups)
    .innerJoin(groups, eq(contactGroups.groupId, groups.id))
    .where(eq(contactGroups.contactId, id));

  contactGroupRows.sort((left, right) => left.name.localeCompare(right.name, "ru"));

  return { contact, notes: contactNotes, groups: contactGroupRows };
}

export async function contactBelongsTo(userId: string, id: number) {
  const [row] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.id, id)))
    .limit(1);

  return Boolean(row);
}
