"use client";

import { useActionState, useState } from "react";

import { deleteContact, type ActionState } from "@/server/contacts";

const initialState: ActionState = {};

export function DeleteContactButton({
  contactId,
  contactName,
}: {
  contactId: number;
  contactName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteContact, initialState);

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
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="id" value={contactId} />
      <p className="sr-only">Удалить контакт «{contactName}»? Это нельзя отменить.</p>
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
        <p role="alert" className="sr-only">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
