export const UNGROUPED_SECTION_TITLE = "Без группы";
export const EMPTY_GROUP_NAME_ERROR = "Введите название";
export const DUPLICATE_GROUP_NAME_ERROR = "Такая группа уже есть";
export const RESERVED_GROUP_NAME_ERROR = "Так назвать нельзя";

export type GroupNameResult = { ok: true; name: string } | { ok: false; error: string };

export type ContactPerson = {
  id: number;
  name: string;
  metThrough: string | null;
};

export type GroupRecord = {
  id: number;
  name: string;
};

export type Membership = {
  contactId: number;
  groupId: number;
};

export type ListedContact = ContactPerson & {
  groupNames: string[];
};

export type HomeSection = {
  title: string;
  contacts: ListedContact[];
};

export type HomeView = {
  sections: HomeSection[];
  groups: GroupRecord[];
  count: number;
  showDueBlock: boolean;
};

export const MISSING_GROUPS_LABEL = "не указано";
export const GROUPS_PAGE = { href: "/groups", label: "Группы" } as const;

export function groupRowLabel(groupNames: readonly string[]) {
  return groupNames.length > 0 ? groupNames.join(", ") : null;
}

export function groupCardLabel(groupNames: readonly string[]) {
  return groupNames.length > 0 ? groupNames.join(", ") : MISSING_GROUPS_LABEL;
}

function byRussianName<T extends { name: string }>(left: T, right: T) {
  return left.name.localeCompare(right.name, "ru");
}

function matchesName(name: string, query: string) {
  const needle = query.trim().toLocaleLowerCase("ru-RU");

  if (!needle) {
    return true;
  }

  return name.toLocaleLowerCase("ru-RU").includes(needle);
}

export function buildHomeView(input: {
  contacts: readonly ContactPerson[];
  groups: readonly GroupRecord[];
  memberships: readonly Membership[];
  query?: string;
  hasDueContacts?: boolean;
}): HomeView {
  const query = input.query ?? "";
  const contacts = input.contacts.filter((contact) => matchesName(contact.name, query));
  const groups = [...input.groups].sort(byRussianName);
  const groupIdsByContact = new Map<number, number[]>();

  for (const membership of input.memberships) {
    const groupIds = groupIdsByContact.get(membership.contactId) ?? [];
    groupIds.push(membership.groupId);
    groupIdsByContact.set(membership.contactId, groupIds);
  }

  function listed(contact: ContactPerson): ListedContact {
    const ids = new Set(groupIdsByContact.get(contact.id) ?? []);

    return {
      ...contact,
      groupNames: groups.filter((group) => ids.has(group.id)).map((group) => group.name),
    };
  }

  const sections: HomeSection[] = [];

  for (const group of groups) {
    const inGroup = contacts
      .filter((contact) => (groupIdsByContact.get(contact.id) ?? []).includes(group.id))
      .sort(byRussianName)
      .map(listed);

    if (inGroup.length > 0) {
      sections.push({ title: group.name, contacts: inGroup });
    }
  }

  const ungrouped = contacts
    .filter((contact) => (groupIdsByContact.get(contact.id) ?? []).length === 0)
    .sort(byRussianName)
    .map(listed);

  if (ungrouped.length > 0) {
    sections.push({ title: UNGROUPED_SECTION_TITLE, contacts: ungrouped });
  }

  return {
    sections,
    groups,
    count: contacts.length,
    showDueBlock: Boolean(input.hasDueContacts) && query.trim().length === 0,
  };
}

function groupNameKey(name: string) {
  return name.trim().toLocaleLowerCase("ru-RU");
}

export function prepareGroupName(
  input: string,
  existingNames: readonly string[],
  currentName?: string,
): GroupNameResult {
  const name = input.trim();

  if (!name) {
    return { ok: false, error: EMPTY_GROUP_NAME_ERROR };
  }

  const key = groupNameKey(name);

  if (key === groupNameKey(UNGROUPED_SECTION_TITLE)) {
    return { ok: false, error: RESERVED_GROUP_NAME_ERROR };
  }

  const currentKey = currentName === undefined ? null : groupNameKey(currentName);
  const taken = existingNames.some(
    (existing) => groupNameKey(existing) === key && groupNameKey(existing) !== currentKey,
  );

  if (taken) {
    return { ok: false, error: DUPLICATE_GROUP_NAME_ERROR };
  }

  return { ok: true, name };
}

export const MISSING_GROUP_ERROR = "Группа уже удалена. Откройте форму ещё раз";

export type MembershipPlan = { ok: true; groupIds: number[] } | { ok: false; error: string };

export function planMembership(
  selectedIds: readonly number[],
  existingGroupIds: readonly number[],
): MembershipPlan {
  const existing = new Set(existingGroupIds);

  if (selectedIds.some((id) => !existing.has(id))) {
    return { ok: false, error: MISSING_GROUP_ERROR };
  }

  return { ok: true, groupIds: [...new Set(selectedIds)] };
}

export function removeGroup(
  groups: readonly GroupRecord[],
  memberships: readonly Membership[],
  groupId: number,
) {
  return {
    groups: groups.filter((group) => group.id !== groupId),
    memberships: memberships.filter((membership) => membership.groupId !== groupId),
  };
}

export function groupsPageState(groups: readonly GroupRecord[]) {
  return {
    empty: groups.length === 0,
    canCreate: true,
    groups: [...groups].sort(byRussianName),
  };
}

export function contactFormGroups(groups: readonly GroupRecord[]) {
  return {
    canCreateGroup: false as const,
    groupsPageHref: GROUPS_PAGE.href,
    canSaveContact: true,
    groups: [...groups].sort(byRussianName),
  };
}

export function groupDeleteSubmission(confirmed: boolean, groupId: number) {
  if (!confirmed) {
    return null;
  }

  return { groupId };
}

export function removeContactFromGroups(
  groups: readonly GroupRecord[],
  memberships: readonly Membership[],
  contactId: number,
) {
  return {
    groups: [...groups],
    memberships: memberships.filter((membership) => membership.contactId !== contactId),
  };
}
