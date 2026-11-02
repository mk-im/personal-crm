"use client";

import { useActionState, useState } from "react";

import { deleteGroup, type GroupActionState } from "@/server/groups";

const initialState: GroupActionState = {};

export function DeleteGroupButton({ groupId, groupName }: { groupId: number; groupName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteGroup, initialState);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-ui-14 font-semibold text-destructive hover:text-ink"
      >
        Удалить
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={groupId} />
      <p className="sr-only">Удалить группу «{groupName}»? Люди останутся в списке.</p>
      <button
        type="submit"
        disabled={pending}
        className="text-ui-14 font-semibold text-destructive hover:text-ink disabled:opacity-50"
      >
        {pending ? "Удаление…" : "Точно удалить?"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="text-ui-14 font-semibold text-label hover:text-ink disabled:opacity-50"
      >
        Отмена
      </button>
      {state.error ? (
        <p role="alert" className="text-ui-14 text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
