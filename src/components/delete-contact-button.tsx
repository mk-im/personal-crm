"use client";

import { useActionState } from "react";

import { deleteContact, type ActionState } from "@/server/contacts";

const initialState: ActionState = {};

export function DeleteContactButton({
  contactId,
  contactName,
}: {
  contactId: number;
  contactName: string;
}) {
  const [state, formAction, pending] = useActionState(deleteContact, initialState);

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none text-ui-14 font-semibold text-destructive hover:text-ink [&::-webkit-details-marker]:hidden">
        Удалить
      </summary>
      <form
        action={formAction}
        className="absolute right-0 z-10 mt-2 flex items-center gap-3 whitespace-nowrap rounded-r14 bg-white p-3 shadow-card"
      >
        <input type="hidden" name="id" value={contactId} />
        <p className="sr-only">Удалить контакт «{contactName}»? Это нельзя отменить.</p>
        <button
          type="submit"
          disabled={pending}
          className="text-ui-14 font-semibold text-destructive hover:text-ink disabled:opacity-50"
        >
          {pending ? "Удаление…" : "Точно удалить?"}
        </button>
        {state.error ? (
          <p role="alert" className="sr-only">
            {state.error}
          </p>
        ) : null}
      </form>
    </details>
  );
}
