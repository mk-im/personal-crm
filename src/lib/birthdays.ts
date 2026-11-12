export type BirthdayCandidate = {
  id: number;
  name: string;
  birthDate: string;
};

export type UpcomingBirthday = {
  id: number;
  name: string;
  daysUntil: number;
  when: string;
};

const WINDOW_DAYS = 7;
const MS_PER_DAY = 86_400_000;

type CalendarDay = {
  year: number;
  month: number;
  day: number;
};

export function upcomingBirthdays(
  candidates: readonly BirthdayCandidate[],
  today: string,
): UpcomingBirthday[] {
  const todayParts = parseCalendarDay(today);

  if (!todayParts) {
    return [];
  }

  return candidates
    .flatMap((candidate) => {
      const birth = parseCalendarDay(candidate.birthDate);

      if (!birth) {
        return [];
      }

      const daysUntil = daysUntilNextBirthday(birth, todayParts);

      if (daysUntil > WINDOW_DAYS) {
        return [];
      }

      return [
        {
          id: candidate.id,
          name: candidate.name,
          daysUntil,
          when: birthdayWhen(daysUntil),
        },
      ];
    })
    .sort((left, right) => {
      if (left.daysUntil !== right.daysUntil) {
        return left.daysUntil - right.daysUntil;
      }

      return left.name.localeCompare(right.name, "ru");
    });
}

export function moscowToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const birthDateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatBirthDate(value: string | null) {
  const parsed = value ? parseCalendarDay(value) : null;

  if (!parsed) {
    return null;
  }

  return birthDateFormat.format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)));
}

export function readBirthDate(
  formData: FormData,
): { ok: true; value: string | null } | { ok: false } {
  const raw = String(formData.get("birthDate") ?? "").trim();

  if (raw.length === 0) {
    return { ok: true, value: null };
  }

  if (!parseCalendarDay(raw)) {
    return { ok: false };
  }

  return { ok: true, value: raw };
}

function daysUntilNextBirthday(birth: CalendarDay, today: CalendarDay) {
  const thisYear = dayNumber(observedBirthday(birth, today.year));
  const todayNumber = dayNumber(today);
  const thisYearDistance = thisYear - todayNumber;

  if (thisYearDistance >= 0) {
    return thisYearDistance;
  }

  return dayNumber(observedBirthday(birth, today.year + 1)) - todayNumber;
}

function observedBirthday(birth: CalendarDay, year: number): CalendarDay {
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(year)) {
    return { year, month: 3, day: 1 };
  }

  return { year, month: birth.month, day: birth.day };
}

function birthdayWhen(daysUntil: number) {
  if (daysUntil === 0) {
    return "сегодня";
  }

  if (daysUntil === 1) {
    return "завтра";
  }

  return `через ${daysUntil} ${daysWord(daysUntil)}`;
}

function daysWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "дня";
  }

  return "дней";
}

function parseCalendarDay(value: string): CalendarDay | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }

  return { year, month, day };
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }

  return 31;
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayNumber(day: CalendarDay) {
  return Math.floor(Date.UTC(day.year, day.month - 1, day.day) / MS_PER_DAY);
}
