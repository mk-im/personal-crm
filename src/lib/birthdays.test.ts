import { describe, expect, it } from "vitest";

import { upcomingBirthdays, type BirthdayCandidate } from "./birthdays";

function person(
  overrides: Partial<BirthdayCandidate> & Pick<BirthdayCandidate, "id" | "birthDate">,
): BirthdayCandidate {
  return {
    name: `Person ${overrides.id}`,
    ...overrides,
  };
}

describe("upcoming birthdays", () => {
  const today = "2026-11-12";

  it("says сегодня when the month and day match today", () => {
    expect(
      upcomingBirthdays([person({ id: 1, name: "Анна", birthDate: "1990-11-12" })], today),
    ).toEqual([{ id: 1, name: "Анна", daysUntil: 0, when: "сегодня" }]);
  });

  it("says завтра when the birthday is tomorrow", () => {
    expect(
      upcomingBirthdays([person({ id: 1, name: "Анна", birthDate: "1990-11-13" })], today),
    ).toEqual([{ id: 1, name: "Анна", daysUntil: 1, when: "завтра" }]);
  });

  it("says через N дней for a birthday 2 to 7 days away", () => {
    expect(
      upcomingBirthdays(
        [
          person({ id: 2, name: "Борис", birthDate: "1985-11-14" }),
          person({ id: 5, name: "Вера", birthDate: "2001-11-17" }),
          person({ id: 7, name: "Глеб", birthDate: "1977-11-19" }),
        ],
        today,
      ).map((row) => row.when),
    ).toEqual(["через 2 дня", "через 5 дней", "через 7 дней"]);
  });

  it("leaves out a birthday 8 days away", () => {
    expect(upcomingBirthdays([person({ id: 1, birthDate: "1990-11-20" })], today)).toEqual([]);
  });

  it("leaves out a birthday that already passed and is more than 7 days next year", () => {
    expect(upcomingBirthdays([person({ id: 1, birthDate: "1990-11-01" })], today)).toEqual([]);
  });

  it("includes a birthday that crosses the new year", () => {
    expect(
      upcomingBirthdays([person({ id: 1, name: "Анна", birthDate: "1990-01-02" })], "2026-12-30"),
    ).toEqual([{ id: 1, name: "Анна", daysUntil: 3, when: "через 3 дня" }]);
  });

  it("treats February 29 as March 1 in a non-leap year", () => {
    expect(
      upcomingBirthdays([person({ id: 1, name: "Анна", birthDate: "2000-02-29" })], "2026-03-01"),
    ).toEqual([{ id: 1, name: "Анна", daysUntil: 0, when: "сегодня" }]);
  });

  it("keeps February 29 on February 29 in a leap year", () => {
    expect(
      upcomingBirthdays([person({ id: 1, name: "Анна", birthDate: "2000-02-29" })], "2028-02-29"),
    ).toEqual([{ id: 1, name: "Анна", daysUntil: 0, when: "сегодня" }]);
  });

  it("puts the nearest birthday first", () => {
    const result = upcomingBirthdays(
      [
        person({ id: 6, name: "Шесть", birthDate: "1990-11-18" }),
        person({ id: 2, name: "Два", birthDate: "1990-11-14" }),
      ],
      today,
    );

    expect(result.map((row) => row.id)).toEqual([2, 6]);
  });

  it("orders the same day by Russian name", () => {
    const result = upcomingBirthdays(
      [
        person({ id: 2, name: "Борис", birthDate: "1990-11-14" }),
        person({ id: 1, name: "Анна", birthDate: "1980-11-14" }),
      ],
      today,
    );

    expect(result.map((row) => row.name)).toEqual(["Анна", "Борис"]);
  });

  it("shows every match, not only five", () => {
    const people = [12, 13, 14, 15, 16, 17].map((day, index) =>
      person({
        id: index + 1,
        name: `Имя ${index + 1}`,
        birthDate: `1990-11-${day}`,
      }),
    );

    expect(upcomingBirthdays(people, today)).toHaveLength(6);
  });
});
