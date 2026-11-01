"use client";

import { useActionState, useState, type ReactNode } from "react";

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

function FrequencyField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = KEEP_IN_TOUCH_OPTIONS.find((option) => option.value === value);
  const label = selected?.label ?? "Не задано";

  function choose(next: string) {
    setValue(next);
    setOpen(false);
  }

  return (
    <Field id="keepInTouchFrequency" label={KEEP_IN_TOUCH_FIELD_LABEL}>
      <input type="hidden" name="keepInTouchFrequency" value={value} />
      <button
        type="button"
        id="keepInTouchFrequency"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="keepInTouchFrequency-list"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between bg-transparent py-0.5 text-left text-body font-semibold text-ink"
      >
        <span>{label}</span>
        <span className="text-label" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <ul
          id="keepInTouchFrequency-list"
          role="listbox"
          aria-label={KEEP_IN_TOUCH_FIELD_LABEL}
          className="mt-2 flex flex-col border-t border-divider pt-1"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              onClick={() => choose("")}
              className={`w-full cursor-pointer py-2 text-left text-body font-semibold ${value === "" ? "text-blue-1" : "text-ink"}`}
            >
              Не задано
            </button>
          </li>
          {KEEP_IN_TOUCH_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => choose(option.value)}
                className={`w-full cursor-pointer py-2 text-left text-body font-semibold ${
                  value === option.value ? "text-blue-1" : "text-ink"
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  );
}

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
      <FrequencyField defaultValue={contact?.keepInTouchFrequency ?? ""} />
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
