"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { contacts, notes } from "@/db/schema";

export type ActionState = {
  error?: string;
};

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function createContact(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Введите имя" };
  }

  const [created] = await db
    .insert(contacts)
    .values({
      name,
      metThrough: optionalText(formData, "metThrough"),
      phone: optionalText(formData, "phone"),
      email: optionalText(formData, "email"),
      agreement: optionalText(formData, "agreement"),
    })
    .returning({ id: contacts.id });

  revalidatePath("/");
  redirect(`/contacts/${created.id}`);
}

export async function updateContact(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Контакт не найден" };
  }

  if (!name) {
    return { error: "Введите имя" };
  }

  const [existing] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);

  if (!existing) {
    return { error: "Контакт не найден" };
  }

  await db
    .update(contacts)
    .set({
      name,
      metThrough: optionalText(formData, "metThrough"),
      phone: optionalText(formData, "phone"),
      email: optionalText(formData, "email"),
      agreement: optionalText(formData, "agreement"),
    })
    .where(eq(contacts.id, id));

  revalidatePath("/");
  revalidatePath(`/contacts/${id}`);
  revalidatePath(`/contacts/${id}/edit`);
  redirect(`/contacts/${id}`);
}

export async function addNote(_state: ActionState, formData: FormData): Promise<ActionState> {
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
}
