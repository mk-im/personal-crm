"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { db } from "@/db";
import { contacts, notes } from "@/db/schema";
import { readKeepInTouchFrequency } from "@/lib/keep-in-touch";

export type ActionState = {
  error?: string;
};

const SAVE_FAILED = "Не получилось сохранить";
const DELETE_FAILED = "Не получилось удалить";

async function runContactAction(
  action: string,
  failedMessage: string,
  work: () => Promise<ActionState>,
): Promise<ActionState> {
  try {
    return await work();
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

export async function createContact(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runContactAction("createContact", SAVE_FAILED, async () => {
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      return { error: "Введите имя" };
    }

    const frequency = readKeepInTouchFrequency(formData);

    if (!frequency.ok) {
      return { error: "Выберите частоту" };
    }

    const [created] = await db
      .insert(contacts)
      .values({
        name,
        metThrough: optionalText(formData, "metThrough"),
        phone: optionalText(formData, "phone"),
        email: optionalText(formData, "email"),
        agreement: optionalText(formData, "agreement"),
        keepInTouchFrequency: frequency.value,
        keepInTouchSetAt: frequency.value ? new Date() : null,
      })
      .returning({ id: contacts.id });

    revalidatePath("/");
    redirect(`/contacts/${created.id}`);
  });
}

export async function updateContact(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runContactAction("updateContact", SAVE_FAILED, async () => {
    const id = Number(formData.get("id"));
    const name = String(formData.get("name") ?? "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      return { error: "Контакт не найден" };
    }

    if (!name) {
      return { error: "Введите имя" };
    }

    const frequency = readKeepInTouchFrequency(formData);

    if (!frequency.ok) {
      return { error: "Выберите частоту" };
    }

    const [existing] = await db
      .select({
        id: contacts.id,
        keepInTouchFrequency: contacts.keepInTouchFrequency,
      })
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (!existing) {
      return { error: "Контакт не найден" };
    }

    const frequencyChanged = existing.keepInTouchFrequency !== frequency.value;

    await db
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
      .where(eq(contacts.id, id));

    revalidatePath("/");
    revalidatePath(`/contacts/${id}`);
    revalidatePath(`/contacts/${id}/edit`);
    redirect(`/contacts/${id}`);
  });
}

export async function addNote(_state: ActionState, formData: FormData): Promise<ActionState> {
  return runContactAction("addNote", SAVE_FAILED, async () => {
    const contactId = Number(formData.get("contactId"));
    const body = String(formData.get("body") ?? "").trim();

    if (!Number.isInteger(contactId) || contactId <= 0) {
      return { error: "Контакт не найден" };
    }

    if (!body) {
      return { error: "Напишите заметку" };
    }

    const [existing] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (!existing) {
      return { error: "Контакт не найден" };
    }

    await db.insert(notes).values({ contactId, body });
    revalidatePath("/");
    revalidatePath(`/contacts/${contactId}`);
    redirect(`/contacts/${contactId}`);
  });
}

export async function deleteContact(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runContactAction("deleteContact", DELETE_FAILED, async () => {
    const id = Number(formData.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return { error: "Контакт не найден" };
    }

    const [existing] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (!existing) {
      return { error: "Контакт не найден" };
    }

    await db.delete(contacts).where(eq(contacts.id, id));
    revalidatePath("/");
    revalidatePath(`/contacts/${id}`);
    revalidatePath(`/contacts/${id}/edit`);
    redirect("/");
  });
}
