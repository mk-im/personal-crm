"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { db } from "@/db";
import { contactGroups, contacts, groups, notes } from "@/db/schema";
import { planMembership } from "@/lib/groups";
import { readKeepInTouchFrequency } from "@/lib/keep-in-touch";
import { requireUserId } from "@/lib/session";

export type ActionState = {
  error?: string;
};

const SAVE_FAILED = "Не получилось сохранить";
const DELETE_FAILED = "Не получилось удалить";
const CONTACT_NOT_FOUND = "Контакт не найден";

async function runContactAction(
  action: string,
  failedMessage: string,
  work: (userId: string) => Promise<ActionState>,
): Promise<ActionState> {
  try {
    // No session: requireUserId redirects to the sign-in page before any data is touched.
    const userId = await requireUserId();
    return await work(userId);
  } catch (error) {
    unstable_rethrow(error);
    console.error(`${action} failed`);
    return { error: failedMessage };
  }
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function readGroupIds(formData: FormData) {
  return formData.getAll("groupId").flatMap((value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? [id] : [];
  });
}

// Someone else's contact looks exactly like a missing one.
async function findOwnContact(userId: string, id: number) {
  const [existing] = await db
    .select({
      id: contacts.id,
      keepInTouchFrequency: contacts.keepInTouchFrequency,
    })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.id, id)))
    .limit(1);

  return existing ?? null;
}

export async function createContact(_state: ActionState, formData: FormData): Promise<ActionState> {
  return runContactAction("createContact", SAVE_FAILED, async (userId) => {
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      return { error: "Введите имя" };
    }

    const frequency = readKeepInTouchFrequency(formData);

    if (!frequency.ok) {
      return { error: "Выберите частоту" };
    }

    const created = await db.transaction(async (tx) => {
      const existingGroups = await tx
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.userId, userId));
      const plan = planMembership(
        readGroupIds(formData),
        existingGroups.map((group) => group.id),
      );

      if (!plan.ok) {
        return plan;
      }

      const [row] = await tx
        .insert(contacts)
        .values({
          userId,
          name,
          metThrough: optionalText(formData, "metThrough"),
          phone: optionalText(formData, "phone"),
          email: optionalText(formData, "email"),
          agreement: optionalText(formData, "agreement"),
          keepInTouchFrequency: frequency.value,
          keepInTouchSetAt: frequency.value ? new Date() : null,
        })
        .returning({ id: contacts.id });

      if (plan.groupIds.length > 0) {
        await tx
          .insert(contactGroups)
          .values(plan.groupIds.map((groupId) => ({ contactId: row.id, groupId })));
      }

      return { ok: true as const, id: row.id };
    });

    if (!created.ok) {
      return { error: created.error };
    }

    revalidatePath("/");
    revalidatePath("/groups");
    redirect(`/contacts/${created.id}`);
  });
}

export async function updateContact(_state: ActionState, formData: FormData): Promise<ActionState> {
  return runContactAction("updateContact", SAVE_FAILED, async (userId) => {
    const id = Number(formData.get("id"));
    const name = String(formData.get("name") ?? "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      return { error: CONTACT_NOT_FOUND };
    }

    if (!name) {
      return { error: "Введите имя" };
    }

    const frequency = readKeepInTouchFrequency(formData);

    if (!frequency.ok) {
      return { error: "Выберите частоту" };
    }

    const existing = await findOwnContact(userId, id);

    if (!existing) {
      return { error: CONTACT_NOT_FOUND };
    }

    const frequencyChanged = existing.keepInTouchFrequency !== frequency.value;

    const saved = await db.transaction(async (tx) => {
      const existingGroups = await tx
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.userId, userId));
      const plan = planMembership(
        readGroupIds(formData),
        existingGroups.map((group) => group.id),
      );

      if (!plan.ok) {
        return plan;
      }

      await tx
        .update(contacts)
        .set({
          name,
          metThrough: optionalText(formData, "metThrough"),
          phone: optionalText(formData, "phone"),
          email: optionalText(formData, "email"),
          agreement: optionalText(formData, "agreement"),
          ...(frequencyChanged
            ? frequency.value
              ? { keepInTouchFrequency: frequency.value, keepInTouchSetAt: new Date() }
              : { keepInTouchFrequency: null, keepInTouchSetAt: null }
            : {}),
        })
        .where(and(eq(contacts.userId, userId), eq(contacts.id, id)));

      await tx.delete(contactGroups).where(eq(contactGroups.contactId, id));

      if (plan.groupIds.length > 0) {
        await tx
          .insert(contactGroups)
          .values(plan.groupIds.map((groupId) => ({ contactId: id, groupId })));
      }

      return { ok: true as const };
    });

    if (!saved.ok) {
      return { error: saved.error };
    }

    revalidatePath("/");
    revalidatePath("/groups");
    revalidatePath(`/contacts/${id}`);
    revalidatePath(`/contacts/${id}/edit`);
    redirect(`/contacts/${id}`);
  });
}

export async function addNote(_state: ActionState, formData: FormData): Promise<ActionState> {
  return runContactAction("addNote", SAVE_FAILED, async (userId) => {
    const contactId = Number(formData.get("contactId"));
    const body = String(formData.get("body") ?? "").trim();

    if (!Number.isInteger(contactId) || contactId <= 0) {
      return { error: CONTACT_NOT_FOUND };
    }

    if (!body) {
      return { error: "Напишите заметку" };
    }

    const existing = await findOwnContact(userId, contactId);

    if (!existing) {
      return { error: CONTACT_NOT_FOUND };
    }

    await db.insert(notes).values({ contactId, body });
    revalidatePath("/");
    revalidatePath(`/contacts/${contactId}`);
    redirect(`/contacts/${contactId}`);
  });
}

export async function deleteContact(_state: ActionState, formData: FormData): Promise<ActionState> {
  return runContactAction("deleteContact", DELETE_FAILED, async (userId) => {
    const id = Number(formData.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return { error: CONTACT_NOT_FOUND };
    }

    const existing = await findOwnContact(userId, id);

    if (!existing) {
      return { error: CONTACT_NOT_FOUND };
    }

    await db.delete(contacts).where(and(eq(contacts.userId, userId), eq(contacts.id, id)));
    revalidatePath("/");
    revalidatePath("/groups");
    revalidatePath(`/contacts/${id}`);
    revalidatePath(`/contacts/${id}/edit`);
    redirect("/");
  });
}
