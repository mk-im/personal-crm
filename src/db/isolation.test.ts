import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "./index";
import { getContact, listContacts, listDueContacts, listGroups, listMemberships } from "./queries";
import { contactGroups, contacts, groups, notes } from "./schema";
import { DUPLICATE_GROUP_NAME_ERROR } from "@/lib/groups";
import { addNote, deleteContact, updateContact } from "@/server/contacts";
import { createGroup, deleteGroup, renameGroup } from "@/server/groups";
import { createTestUser, deleteTestUsers } from "@/test/db";
import { currentUserId, expectRedirect, formData } from "@/test/next-mocks";

vi.mock("next/cache", async () => (await import("@/test/next-mocks")).cacheMock());
vi.mock("next/navigation", async () => (await import("@/test/next-mocks")).navigationMock());
vi.mock("@/lib/session", async () => (await import("@/test/next-mocks")).sessionMock());

let alice: { id: string; email: string };
let bob: { id: string; email: string };
let aliceContactId = 0;
let aliceGroupId = 0;

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

beforeAll(async () => {
  alice = await createTestUser("alice");
  bob = await createTestUser("bob");

  const [aliceContact] = await db
    .insert(contacts)
    .values({
      userId: alice.id,
      name: "Иван Петров",
      keepInTouchFrequency: "weekly",
      keepInTouchSetAt: thirtyDaysAgo(),
    })
    .returning({ id: contacts.id });
  aliceContactId = aliceContact.id;
  await db.insert(contacts).values({ userId: bob.id, name: "Иван Сидоров" });

  // The note is old too, so the weekly contact is overdue for its owner.
  await db
    .insert(notes)
    .values({ contactId: aliceContactId, body: "Заметка Алисы", createdAt: thirtyDaysAgo() });

  const [aliceGroup] = await db
    .insert(groups)
    .values({ userId: alice.id, name: "Семья" })
    .returning({ id: groups.id });
  aliceGroupId = aliceGroup.id;
  await db.insert(contactGroups).values({ contactId: aliceContactId, groupId: aliceGroupId });
});

afterAll(async () => {
  await deleteTestUsers();
});

describe("isolation between users", () => {
  it("List and search hide the other person's contact", async () => {
    const all = await listContacts(bob.id, "");
    const found = await listContacts(bob.id, "Иван");

    expect(all.map((row) => row.name)).toEqual(["Иван Сидоров"]);
    expect(found.map((row) => row.name)).toEqual(["Иван Сидоров"]);
    expect(await listContacts(bob.id, "Петров")).toEqual([]);
  });

  it("Notes, groups, and the due block stay separate", async () => {
    const own = await getContact(alice.id, aliceContactId);

    expect(own?.notes.map((note) => note.body)).toEqual(["Заметка Алисы"]);
    expect(own?.groups.map((group) => group.name)).toEqual(["Семья"]);
    expect(await getContact(bob.id, aliceContactId)).toBeNull();
    expect(await listGroups(bob.id)).toEqual([]);
    expect(await listMemberships(bob.id, [aliceContactId])).toEqual([]);
    expect((await listDueContacts(bob.id)).map((row) => row.id)).not.toContain(aliceContactId);
  });

  it("Direct server request for someone else's record", async () => {
    currentUserId.value = bob.id;

    const updated = await updateContact(
      {},
      formData({ id: String(aliceContactId), name: "Чужое имя", keepInTouchFrequency: "" }),
    );
    const noted = await addNote({}, formData({ contactId: String(aliceContactId), body: "Чужая" }));
    const deleted = await deleteContact({}, formData({ id: String(aliceContactId) }));
    const renamed = await renameGroup({}, formData({ id: String(aliceGroupId), name: "Чужая" }));
    const groupDeleted = await deleteGroup({}, formData({ id: String(aliceGroupId) }));

    expect(updated).toEqual({ error: "Контакт не найден" });
    expect(noted).toEqual({ error: "Контакт не найден" });
    expect(deleted).toEqual({ error: "Контакт не найден" });
    expect(renamed).toEqual({ error: "Группа не найдена" });
    expect(groupDeleted).toEqual({ error: "Группа не найдена" });

    const [contact] = await db.select().from(contacts).where(eq(contacts.id, aliceContactId));
    const contactNotes = await db.select().from(notes).where(eq(notes.contactId, aliceContactId));
    const [group] = await db.select().from(groups).where(eq(groups.id, aliceGroupId));

    expect(contact.name).toBe("Иван Петров");
    expect(contactNotes).toHaveLength(1);
    expect(group.name).toBe("Семья");
  });

  it("Same name for another user", async () => {
    currentUserId.value = bob.id;
    expect(await expectRedirect(createGroup({}, formData({ name: "Семья" })))).toBe("/groups");

    currentUserId.value = alice.id;
    expect(await createGroup({}, formData({ name: "семья" }))).toEqual({
      error: DUPLICATE_GROUP_NAME_ERROR,
    });

    expect((await listGroups(bob.id)).map((group) => group.name)).toEqual(["Семья"]);
    expect((await listGroups(alice.id)).map((group) => group.name)).toEqual(["Семья"]);
  });

  it("Another user's overdue contact stays hidden", async () => {
    const ownDue = await listDueContacts(alice.id);
    const otherDue = await listDueContacts(bob.id);

    expect(ownDue.map((row) => row.id)).toContain(aliceContactId);
    expect(otherDue).toEqual([]);
  });
});
