"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addNote, type ActionState } from "@/server/contacts";

const initialState: ActionState = {};

export function NoteForm({ contactId }: { contactId: number }) {
  const [state, formAction, pending] = useActionState(addNote, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="contactId" value={contactId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Заметка после разговора</Label>
        <Textarea id="body" name="body" required />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Сохранение…" : "Добавить заметку"}
      </Button>
    </form>
  );
}
