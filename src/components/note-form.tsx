"use client";

import { useActionState } from "react";

import { CtaButton } from "@/components/cta-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addNote, type ActionState } from "@/server/contacts";

const initialState: ActionState = {};

export function NoteForm({ contactId }: { contactId: number }) {
  const [state, formAction, pending] = useActionState(addNote, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-r22 bg-white p-4.5 shadow-card lg:rounded-r26 lg:p-6.5 lg:shadow-card-lg">
      <input type="hidden" name="contactId" value={contactId} />
      <div className="rounded-r14 bg-mist px-3 py-2.5 lg:rounded-r16 lg:px-4 lg:py-3.5">
        <Label htmlFor="body" className="mb-1">
          Заметка после разговора
        </Label>
        <Textarea
          id="body"
          name="body"
          required
          className="min-h-20 border-transparent bg-transparent px-0 py-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-ui-14 text-destructive">
          {state.error}
        </p>
      ) : null}
      <CtaButton type="submit" disabled={pending} icon="✓" className="w-full">
        {pending ? "Сохранение…" : "Добавить заметку"}
      </CtaButton>
    </form>
  );
}
