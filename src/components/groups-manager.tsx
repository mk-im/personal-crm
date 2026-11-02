"use client";

import { useActionState } from "react";

import { DeleteGroupButton } from "@/components/delete-group-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { groupsPageState, type GroupRecord } from "@/lib/groups";
import { createGroup, renameGroup, type GroupActionState } from "@/server/groups";

const initialState: GroupActionState = {};

function CreateGroupForm() {
  const [state, formAction, pending] = useActionState(createGroup, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-r22 bg-white p-4 shadow-card lg:rounded-r26 lg:p-5 lg:shadow-card-lg"
    >
      <Label htmlFor="group-name">Новая группа</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input id="group-name" name="name" autoComplete="off" className="border-transparent bg-mist" />
        <button type="submit" disabled={pending} className={buttonVariants({ size: "lg" })}>
          {pending ? "Сохранение…" : "Создать"}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-ui-14 text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function RenameGroupForm({ group }: { group: GroupRecord }) {
  const [state, formAction, pending] = useActionState(renameGroup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="id" value={group.id} />
      <Label htmlFor={`group-name-${group.id}`} className="sr-only">
        Название группы {group.name}
      </Label>
      <Input
        id={`group-name-${group.id}`}
        name="name"
        defaultValue={group.name}
        autoComplete="off"
        className="border-transparent bg-mist"
      />
      <button type="submit" disabled={pending} className={buttonVariants({ size: "lg" })}>
        {pending ? "Сохранение…" : "Сохранить"}
      </button>
      {state.error ? (
        <p role="alert" className="text-ui-14 text-destructive sm:basis-full">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function GroupsManager({ groups }: { groups: GroupRecord[] }) {
  const page = groupsPageState(groups);

  return (
    <div className="flex flex-col gap-6">
      <CreateGroupForm />
      {page.empty ? (
        <p className="rounded-r22 bg-white px-4 py-10 text-center text-muted shadow-card lg:rounded-r26 lg:shadow-card-lg">
          Пока нет групп
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {page.groups.map((group) => (
            <li
              key={group.id}
              className="flex flex-col gap-3 rounded-r22 bg-white p-4 shadow-card lg:rounded-r26 lg:p-5 lg:shadow-card-lg"
            >
              <p className="text-ui-15 font-bold lg:text-ui-17">{group.name}</p>
              <RenameGroupForm group={group} />
              <DeleteGroupButton groupId={group.id} groupName={group.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
