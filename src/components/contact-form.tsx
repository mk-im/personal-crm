"use client";

import { useActionState, type ReactNode } from "react";

import { CtaButton } from "@/components/cta-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KeepInTouchFrequency } from "@/db/schema";
import { KEEP_IN_TOUCH_FIELD_LABEL, KEEP_IN_TOUCH_OPTIONS } from "@/lib/keep-in-touch";
import { createContact, updateContact, type ActionState } from "@/server/contacts";

const initialState: ActionState = {};

export type ContactFormValues = {
  id: number;
  name: string;
  metThrough: string | null;
  phone: string | null;
  email: string | null;
  agreement: string | null;
  keepInTouchFrequency: KeepInTouchFrequency | null;
};

function Field({
  id,
  label,
  accent = false,
  children,
}: {
  id: string;
  label: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-r14 border border-note-line bg-note px-3 py-2.5 lg:rounded-r16 lg:px-4 lg:py-3.5"
          : "rounded-r14 bg-mist px-3 py-2.5 lg:rounded-r16 lg:px-4 lg:py-3.5"
      }
    >
      <Label htmlFor={id} className={accent ? "mb-1 text-blue-1" : "mb-1"}>
        {label}
      </Label>
      {children}
    </div>
  );
}

const fieldControlClass =
  "h-auto border-transparent bg-transparent px-0 py-0 shadow-none focus-visible:border-transparent focus-visible:ring-0";

export function ContactForm({ contact }: { contact?: ContactFormValues }) {
  const action = contact ? updateContact : createContact;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-r22 bg-white p-4.5 shadow-card lg:rounded-r26 lg:p-6.5 lg:shadow-card-lg">
      {contact ? <input type="hidden" name="id" value={contact.id} /> : null}
      <Field id="name" label="Имя">
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
          defaultValue={contact?.name ?? ""}
          className={fieldControlClass}
        />
      </Field>
      <Field id="metThrough" label="Откуда знакомы" accent>
        <Input
          id="metThrough"
          name="metThrough"
          defaultValue={contact?.metThrough ?? ""}
          className={fieldControlClass}
        />
      </Field>
      <Field id="phone" label="Телефон">
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={contact?.phone ?? ""}
          className={fieldControlClass}
        />
      </Field>
      <Field id="email" label="Почта">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={contact?.email ?? ""}
          className={fieldControlClass}
        />
      </Field>
      <Field id="agreement" label="О чём договорились" accent>
        <Textarea
          id="agreement"
          name="agreement"
          defaultValue={contact?.agreement ?? ""}
          className={`${fieldControlClass} min-h-20`}
        />
      </Field>
      <Field id="keepInTouchFrequency" label={KEEP_IN_TOUCH_FIELD_LABEL}>
        <select
          id="keepInTouchFrequency"
          name="keepInTouchFrequency"
          defaultValue={contact?.keepInTouchFrequency ?? ""}
          className={`${fieldControlClass} w-full cursor-pointer bg-transparent text-ui-14 font-semibold lg:text-ui-16`}
        >
          <option value="">Не задано</option>
          {KEEP_IN_TOUCH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      {state.error ? (
        <p role="alert" className="text-ui-14 text-destructive">
          {state.error}
        </p>
      ) : null}
      <CtaButton type="submit" disabled={pending} icon="✓" className="mt-2 w-full">
        {pending ? "Сохранение…" : contact ? "Сохранить изменения" : "Сохранить"}
      </CtaButton>
    </form>
  );
}
