import { describe, expect, it } from "vitest";

import { dueContacts, type DueCandidate } from "./keep-in-touch";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-11-05T06:00:00.000Z");

const periods = [
  ["weekly", 7],
  ["monthly", 30],
  ["quarterly", 90],
  ["yearly", 365],
] as const;

function person(overrides: Partial<DueCandidate> & Pick<DueCandidate, "id">): DueCandidate {
  return {
    name: `Person ${overrides.id}`,
    frequency: "weekly",
    frequencySetAt: new Date(now.getTime() - 40 * day),
    latestNoteAt: null,
    ...overrides,
  };
}

describe("due contacts", () => {
  it("leaves a contact out when frequency is empty", () => {
    expect(
      dueContacts(
        [person({ id: 1, frequency: null, frequencySetAt: null, latestNoteAt: null })],
        now,
      ),
    ).toEqual([]);
  });

  it("counts the period from the newest note", () => {
    const result = dueContacts(
      [
        person({
          id: 1,
          frequency: "weekly",
          frequencySetAt: new Date(now.getTime() - 40 * day),
          latestNoteAt: new Date(now.getTime() - 10 * day),
        }),
      ],
      now,
    );

    expect(result).toEqual([
      expect.objectContaining({ id: 1, keepInTouchFrequency: "weekly", overdueDays: 3 }),
    ]);
  });

  it("counts from the frequency save when there are no notes", () => {
    const result = dueContacts(
      [
        person({
          id: 1,
          frequency: "weekly",
          frequencySetAt: new Date(now.getTime() - 10 * day),
          latestNoteAt: null,
        }),
      ],
      now,
    );

    expect(result).toEqual([expect.objectContaining({ id: 1, overdueDays: 3 })]);
  });

  it("starts again from a frequency save when there are no notes", () => {
    expect(
      dueContacts(
        [
          person({
            id: 1,
            frequency: "weekly",
            frequencySetAt: new Date(now.getTime() - 2 * day),
            latestNoteAt: null,
          }),
        ],
        now,
      ),
    ).toEqual([]);
  });

  it("keeps counting from the newest note when the frequency changes", () => {
    expect(
      dueContacts(
        [
          person({
            id: 1,
            frequency: "monthly",
            frequencySetAt: new Date(now.getTime() - day),
            latestNoteAt: new Date(now.getTime() - 10 * day),
          }),
        ],
        now,
      ),
    ).toEqual([]);
  });

  it("stays out of the block on the last moment of the period", () => {
    for (const [frequency, days] of periods) {
      expect(
        dueContacts(
          [
            person({
              id: 1,
              frequency,
              frequencySetAt: new Date(now.getTime() - days * day),
              latestNoteAt: null,
            }),
          ],
          now,
        ),
      ).toEqual([]);
    }
  });

  it("enters the block once the period is over", () => {
    for (const [frequency, days] of periods) {
      const result = dueContacts(
        [
          person({
            id: 1,
            frequency,
            frequencySetAt: new Date(now.getTime() - days * day - 1),
            latestNoteAt: null,
          }),
        ],
        now,
      );

      expect(result).toEqual([
        expect.objectContaining({ id: 1, keepInTouchFrequency: frequency, overdueDays: 1 }),
      ]);
    }
  });

  it("floors a partial overdue day and still shows at least one day", () => {
    const justOver = dueContacts(
      [
        person({
          id: 1,
          frequencySetAt: new Date(now.getTime() - 7 * day - 1),
        }),
      ],
      now,
    );
    const dayAndAHalf = dueContacts(
      [
        person({
          id: 2,
          frequencySetAt: new Date(now.getTime() - (7 + 1.5) * day),
        }),
      ],
      now,
    );

    expect(justOver[0]?.overdueDays).toBe(1);
    expect(dayAndAHalf[0]?.overdueDays).toBe(1);
  });

  it("keeps the five most overdue contacts", () => {
    const people = [1, 2, 3, 4, 5, 6].map((id) =>
      person({
        id,
        frequencySetAt: new Date(now.getTime() - (10 + id) * day),
      }),
    );

    expect(dueContacts(people, now).map((contact) => contact.id)).toEqual([6, 5, 4, 3, 2]);
  });

  it("drops a contact after a new note inside the period", () => {
    expect(
      dueContacts(
        [
          person({
            id: 1,
            frequency: "weekly",
            frequencySetAt: new Date(now.getTime() - 40 * day),
            latestNoteAt: new Date(now.getTime() - day),
          }),
        ],
        now,
      ),
    ).toEqual([]);
  });

  it("ignores a frequency that has no saved date and no notes", () => {
    expect(
      dueContacts(
        [person({ id: 1, frequency: "weekly", frequencySetAt: null, latestNoteAt: null })],
        now,
      ),
    ).toEqual([]);
  });
});
