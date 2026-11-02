import { describe, expect, it } from "vitest";

import {
  DUPLICATE_GROUP_NAME_ERROR,
  EMPTY_GROUP_NAME_ERROR,
  RESERVED_GROUP_NAME_ERROR,
  UNGROUPED_SECTION_TITLE,
  MISSING_GROUP_ERROR,
  GROUPS_PAGE,
  buildHomeView,
  contactFormGroups,
  groupCardLabel,
  groupDeleteSubmission,
  groupRowLabel,
  groupsPageState,
  planMembership,
  prepareGroupName,
  removeContactFromGroups,
  removeGroup,
  type ContactPerson,
  type GroupRecord,
  type Membership,
} from "./groups";

describe("prepareGroupName", () => {
  it("Create a group", () => {
    expect(prepareGroupName("Теннис", [])).toEqual({ ok: true, name: "Теннис" });
  });

  it("Trim the name", () => {
    expect(prepareGroupName("  Теннис  ", [])).toEqual({ ok: true, name: "Теннис" });
  });

  it("Empty name", () => {
    expect(prepareGroupName("   ", [])).toEqual({ ok: false, error: EMPTY_GROUP_NAME_ERROR });
    expect(prepareGroupName("", [])).toEqual({ ok: false, error: EMPTY_GROUP_NAME_ERROR });
  });

  it("Duplicate name", () => {
    expect(prepareGroupName("семья", ["Семья"])).toEqual({
      ok: false,
      error: DUPLICATE_GROUP_NAME_ERROR,
    });
  });

  it("Reserved name", () => {
    expect(prepareGroupName("без группы", [])).toEqual({
      ok: false,
      error: RESERVED_GROUP_NAME_ERROR,
    });
  });

  it("Rename onto a taken name", () => {
    expect(prepareGroupName("семья", ["Семья", "Теннис"], "Теннис")).toEqual({
      ok: false,
      error: DUPLICATE_GROUP_NAME_ERROR,
    });
  });

  it("Rename a group", () => {
    expect(prepareGroupName("Корт", ["Теннис"], "Теннис")).toEqual({ ok: true, name: "Корт" });
  });
});

function person(id: number, name: string): ContactPerson {
  return { id, name, metThrough: null };
}

const family: GroupRecord = { id: 1, name: "Семья" };
const tennis: GroupRecord = { id: 2, name: "Теннис" };

function membership(contactId: number, groupId: number): Membership {
  return { contactId, groupId };
}

describe("buildHomeView sections", () => {
  it("Alphabetical sections", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня"), person(11, "Боря")],
      groups: [tennis, family],
      memberships: [membership(10, tennis.id), membership(11, family.id)],
    });

    expect(view.sections.map((section) => section.title)).toEqual(["Семья", "Теннис"]);
  });

  it("Person in two sections", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [family, tennis],
      memberships: [membership(10, family.id), membership(10, tennis.id)],
    });

    expect(view.sections.map((section) => section.contacts.map((contact) => contact.name))).toEqual([
      ["Аня"],
      ["Аня"],
    ]);
  });

  it("Ungrouped section is last", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня"), person(11, "Боря")],
      groups: [family],
      memberships: [membership(10, family.id)],
    });

    expect(view.sections.map((section) => section.title)).toEqual(["Семья", UNGROUPED_SECTION_TITLE]);
  });

  it("Empty group stays off the home page", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [family, tennis],
      memberships: [membership(10, family.id)],
    });

    expect(view.sections.map((section) => section.title)).toEqual(["Семья"]);
    expect(view.groups.map((group) => group.name)).toContain("Теннис");
  });

  it("No ungrouped section", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [family],
      memberships: [membership(10, family.id)],
    });

    expect(view.sections.map((section) => section.title)).not.toContain(UNGROUPED_SECTION_TITLE);
  });

  it("People inside a section by name", () => {
    const view = buildHomeView({
      contacts: [person(11, "Борис"), person(10, "Анна")],
      groups: [family],
      memberships: [membership(11, family.id), membership(10, family.id)],
    });

    expect(view.sections[0]?.contacts.map((contact) => contact.name)).toEqual(["Анна", "Борис"]);
  });

  it("No contacts at all", () => {
    const view = buildHomeView({ contacts: [], groups: [], memberships: [] });

    expect(view.sections).toEqual([]);
    expect(view.sections.map((section) => section.title)).not.toContain(UNGROUPED_SECTION_TITLE);
  });
});

describe("buildHomeView labels and search", () => {
  it("Both names on the row and the card", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [tennis, family],
      memberships: [membership(10, tennis.id), membership(10, family.id)],
    });
    const names = view.sections[0]?.contacts[0]?.groupNames;

    expect(names).toEqual(["Семья", "Теннис"]);
    expect(groupRowLabel(names ?? [])).toBe("Семья, Теннис");
    expect(groupCardLabel(names ?? [])).toBe("Семья, Теннис");
  });

  it("Row inside one section still shows the other group", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [family, tennis],
      memberships: [membership(10, family.id), membership(10, tennis.id)],
    });
    const familySection = view.sections.find((section) => section.title === "Семья");

    expect(familySection?.contacts[0]?.groupNames).toEqual(["Семья", "Теннис"]);
  });

  it("Person without groups", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [],
      memberships: [],
    });
    const names = view.sections[0]?.contacts[0]?.groupNames ?? [];

    expect(groupRowLabel(names)).toBeNull();
    expect(groupCardLabel(names)).toBe("не указано");
  });

  it("Search keeps one section", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня"), person(11, "Боря")],
      groups: [family, tennis],
      memberships: [membership(10, family.id), membership(11, tennis.id)],
      query: "Аня",
    });

    expect(view.sections.map((section) => section.title)).toEqual(["Семья"]);
    expect(view.sections[0]?.contacts.map((contact) => contact.name)).toEqual(["Аня"]);
    expect(view.count).toBe(1);
  });

  it("Two sections still count as one person", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [family, tennis],
      memberships: [membership(10, family.id), membership(10, tennis.id)],
    });

    expect(view.sections).toHaveLength(2);
    expect(view.count).toBe(1);
  });

  it("Due block stays whole", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [family],
      memberships: [membership(10, family.id)],
      hasDueContacts: true,
    });

    expect(view.showDueBlock).toBe(true);
    expect(view.sections.map((section) => section.title)).toEqual(["Семья"]);
  });

  it("Due block hides during search", () => {
    const view = buildHomeView({
      contacts: [person(10, "Аня")],
      groups: [family],
      memberships: [membership(10, family.id)],
      query: "Аня",
      hasDueContacts: true,
    });

    expect(view.showDueBlock).toBe(false);
  });
});

describe("membership", () => {
  const anya = person(10, "Аня");

  it("Several groups", () => {
    expect(planMembership([family.id, tennis.id], [family.id, tennis.id])).toEqual({
      ok: true,
      groupIds: [family.id, tennis.id],
    });
  });

  it("No group selected", () => {
    expect(planMembership([], [family.id])).toEqual({ ok: true, groupIds: [] });
  });

  it("Change the set of groups", () => {
    expect(planMembership([tennis.id], [family.id, tennis.id])).toEqual({
      ok: true,
      groupIds: [tennis.id],
    });
  });

  it("Chosen group already deleted", () => {
    expect(planMembership([family.id, 99], [family.id])).toEqual({
      ok: false,
      error: MISSING_GROUP_ERROR,
    });
  });

  it("Confirm delete", () => {
    const next = removeGroup([family, tennis], [membership(anya.id, tennis.id)], tennis.id);
    const view = buildHomeView({
      contacts: [anya],
      groups: next.groups,
      memberships: next.memberships,
    });

    expect(next.groups.map((group) => group.name)).toEqual(["Семья"]);
    expect(view.sections.map((section) => section.title)).toEqual([UNGROUPED_SECTION_TITLE]);
    expect(view.sections[0]?.contacts.map((contact) => contact.name)).toEqual(["Аня"]);
  });

  it("Contact deleted, group remains", () => {
    const next = removeContactFromGroups([tennis], [membership(anya.id, tennis.id)], anya.id);
    const view = buildHomeView({
      contacts: [],
      groups: next.groups,
      memberships: next.memberships,
    });

    expect(view.sections).toEqual([]);
    expect(next.groups.map((group) => group.name)).toEqual(["Теннис"]);
  });
});

describe("groups page and header", () => {
  it("No groups yet", () => {
    expect(groupsPageState([])).toMatchObject({ empty: true, canCreate: true });
  });

  it("Open the page from the header", () => {
    expect(GROUPS_PAGE).toEqual({ href: "/groups", label: "Группы" });
  });

  it("No groups exist yet", () => {
    expect(contactFormGroups([])).toMatchObject({
      canCreateGroup: false,
      groupsPageHref: "/groups",
      canSaveContact: true,
      groups: [],
    });
  });

  it("Cancel delete", () => {
    expect(groupDeleteSubmission(false, tennis.id)).toBeNull();
  });
});
