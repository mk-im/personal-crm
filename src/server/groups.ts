"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { db } from "@/db";
import { groups } from "@/db/schema";
import { DUPLICATE_GROUP_NAME_ERROR, prepareGroupName } from "@/lib/groups";
import { requireUserId } from "@/lib/session";

export type GroupActionState = {
  error?: string;
};

const SAVE_FAILED = "Не получилось сохранить";
const DELETE_FAILED = "Не получилось удалить";
const GROUP_NOT_FOUND = "Группа не найдена";

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
  work: (userId: string) => Promise<GroupActionState>,
): Promise<GroupActionState> {
  try {
    const userId = await requireUserId();
    return await work(userId);
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

// Names are compared only against this user's own groups.
function ownGroups(userId: string) {
  return db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.userId, userId));
}

export async function createGroup(
  _state: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  return runGroupAction("createGroup", SAVE_FAILED, async (userId) => {
    const existing = await ownGroups(userId);
    const prepared = prepareGroupName(
      String(formData.get("name") ?? ""),
      existing.map((group) => group.name),
    );

    if (!prepared.ok) {
      return { error: prepared.error };
    }

    await db.insert(groups).values({ userId, name: prepared.name });
    refreshGroups();
    redirect("/groups");
  });
}

export async function renameGroup(
  _state: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  return runGroupAction("renameGroup", SAVE_FAILED, async (userId) => {
    const id = Number(formData.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return { error: GROUP_NOT_FOUND };
    }

    const existing = await ownGroups(userId);
    const current = existing.find((group) => group.id === id);

    if (!current) {
      return { error: GROUP_NOT_FOUND };
    }

    const prepared = prepareGroupName(
      String(formData.get("name") ?? ""),
      existing.map((group) => group.name),
      current.name,
    );

    if (!prepared.ok) {
      return { error: prepared.error };
    }

    await db
      .update(groups)
      .set({ name: prepared.name })
      .where(and(eq(groups.userId, userId), eq(groups.id, id)));
    refreshGroups();
    redirect("/groups");
  });
}

export async function deleteGroup(
  _state: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  return runGroupAction("deleteGroup", DELETE_FAILED, async (userId) => {
    const id = Number(formData.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return { error: GROUP_NOT_FOUND };
    }

    const deleted = await db
      .delete(groups)
      .where(and(eq(groups.userId, userId), eq(groups.id, id)))
      .returning({ id: groups.id });

    if (deleted.length === 0) {
      return { error: GROUP_NOT_FOUND };
    }

    refreshGroups();
    redirect("/groups");
  });
}
