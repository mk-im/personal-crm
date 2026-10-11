"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createContact, type ActionState } from "@/server/contacts";

const initialState: ActionState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(createContact, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Имя</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="metThrough">Откуда знакомы</Label>
        <Input id="metThrough" name="metThrough" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Почта</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="agreement">О чём договорились</Label>
        <Textarea id="agreement" name="agreement" />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  );
}
