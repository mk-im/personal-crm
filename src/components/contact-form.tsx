"use client";

import { useActionState, type ReactNode } from "react";

import Link from "next/link";

import { CtaButton } from "@/components/cta-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KeepInTouchFrequency } from "@/db/schema";
import { contactFormGroups, type GroupRecord } from "@/lib/groups";
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
  groupIds: number[];
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
  return (
    <Field id="keepInTouchFrequency" label={KEEP_IN_TOUCH_FIELD_LABEL}>
      <select
        id="keepInTouchFrequency"
        name="keepInTouchFrequency"
        defaultValue={defaultValue}
        className="w-full cursor-pointer bg-transparent py-0.5 text-body font-semibold text-ink outline-none"
      >
        <option value="">Не задано</option>
        {KEEP_IN_TOUCH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function GroupsField({ groups, selectedIds }: { groups: GroupRecord[]; selectedIds: number[] }) {
  const field = contactFormGroups(groups);

  return (
    <fieldset className="rounded-r14 bg-mist px-3 py-2.5 lg:rounded-r16 lg:px-4 lg:py-3.5">
      <legend className="mb-1 text-ui-14 font-medium text-label">Группы</legend>
      {field.groups.length === 0 ? (
        <p className="text-body font-semibold text-ink">
          Групп пока нет.{" "}
          <Link href={field.groupsPageHref} className="text-blue-1 hover:text-ink">
            Создать на странице «Группы»
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {field.groups.map((group) => (
            <li key={group.id}>
              <label className="flex items-center gap-2 text-body font-semibold text-ink">
                <input
                  type="checkbox"
                  name="groupId"
                  value={group.id}
                  defaultChecked={selectedIds.includes(group.id)}
                  className="size-4 accent-blue-1"
                />
                {group.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export function ContactForm({
  contact,
  groups,
}: {
  contact?: ContactFormValues;
  groups: GroupRecord[];
}) {
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
      <GroupsField groups={groups} selectedIds={contact?.groupIds ?? []} />
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
