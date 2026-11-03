"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { db } from "@/db";
import { groups } from "@/db/schema";
import { DUPLICATE_GROUP_NAME_ERROR, prepareGroupName } from "@/lib/groups";

export type GroupActionState = {
  error?: string;
};

const SAVE_FAILED = "Не получилось сохранить";
const DELETE_FAILED = "Не получилось удалить";

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("code" in error && error.code === "23505") {
    return true;
  }

  if ("cause" in error) {
    return isUniqueViolation(error.cause);
  }

  return false;
}

async function runGroupAction(
  action: string,
  failedMessage: string,
  work: () => Promise<GroupActionState>,
): Promise<GroupActionState> {
  try {
    return await work();
  } catch (error) {
    unstable_rethrow(error);

    if (isUniqueViolation(error)) {
      return { error: DUPLICATE_GROUP_NAME_ERROR };
    }

    console.error(`${action} failed`);
    return { error: failedMessage };
  }
}

function refreshGroups() {
  revalidatePath("/groups");
  revalidatePath("/");
}

export async function createGroup(
  _state: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  return runGroupAction("createGroup", SAVE_FAILED, async () => {
    const existing = await db.select({ name: groups.name }).from(groups);
    const prepared = prepareGroupName(
      String(formData.get("name") ?? ""),
      existing.map((group) => group.name),
    );

    if (!prepared.ok) {
      return { error: prepared.error };
    }

    await db.insert(groups).values({ name: prepared.name });
    refreshGroups();
    redirect("/groups");
  });
}

export async function renameGroup(
  _state: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  return runGroupAction("renameGroup", SAVE_FAILED, async () => {
    const id = Number(formData.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return { error: "Группа не найдена" };
    }

    const existing = await db.select({ id: groups.id, name: groups.name }).from(groups);
    const current = existing.find((group) => group.id === id);

    if (!current) {
      return { error: "Группа не найдена" };
    }

    const prepared = prepareGroupName(
      String(formData.get("name") ?? ""),
      existing.map((group) => group.name),
      current.name,
    );

    if (!prepared.ok) {
      return { error: prepared.error };
    }

    await db.update(groups).set({ name: prepared.name }).where(eq(groups.id, id));
    refreshGroups();
    redirect("/groups");
  });
}

export async function deleteGroup(
  _state: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  return runGroupAction("deleteGroup", DELETE_FAILED, async () => {
    const id = Number(formData.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return { error: "Группа не найдена" };
    }

    await db.delete(groups).where(eq(groups.id, id));
    refreshGroups();
    redirect("/groups");
  });
}
