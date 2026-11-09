import { keepInTouchFrequencies, type KeepInTouchFrequency } from "@/db/schema";

export const KEEP_IN_TOUCH_FIELD_LABEL = "Как часто общаться";

export const KEEP_IN_TOUCH_LABELS: Record<KeepInTouchFrequency, string> = {
  weekly: "Раз в неделю",
  monthly: "Раз в месяц",
  quarterly: "Раз в квартал",
  yearly: "Раз в год",
};

export const KEEP_IN_TOUCH_OPTIONS = keepInTouchFrequencies.map((value) => ({
  value,
  label: KEEP_IN_TOUCH_LABELS[value],
}));

export function isKeepInTouchFrequency(value: string): value is KeepInTouchFrequency {
  return (keepInTouchFrequencies as readonly string[]).includes(value);
}

export function readKeepInTouchFrequency(
  formData: FormData,
): { ok: true; value: KeepInTouchFrequency | null } | { ok: false } {
  const raw = String(formData.get("keepInTouchFrequency") ?? "").trim();

  if (raw.length === 0) {
    return { ok: true, value: null };
  }

  if (isKeepInTouchFrequency(raw)) {
    return { ok: true, value: raw };
  }

  return { ok: false };
}

export function overdueDaysPhrase(days: number) {
  return `на ${days} ${daysWord(days)}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const KEEP_IN_TOUCH_PERIOD_DAYS: Record<KeepInTouchFrequency, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export type DueCandidate = {
  id: number;
  name: string;
  frequency: string | null;
  frequencySetAt: Date | null;
  latestNoteAt: Date | null;
};

export type DueContact = {
  id: number;
  name: string;
  keepInTouchFrequency: KeepInTouchFrequency;
  overdueDays: number;
};

export function dueContacts(candidates: DueCandidate[], now: Date): DueContact[] {
  return candidates
    .flatMap((candidate) => {
      const overdue = overdueState(candidate, now);

      if (!overdue) {
        return [];
      }

      return [{ candidate, ...overdue }];
    })
    .sort((left, right) => right.overdueMs - left.overdueMs)
    .slice(0, 5)
    .map(({ candidate, frequency, overdueDays }) => ({
      id: candidate.id,
      name: candidate.name,
      keepInTouchFrequency: frequency,
      overdueDays,
    }));
}

function overdueState(candidate: DueCandidate, now: Date) {
  const frequency = candidate.frequency;

  if (!frequency || !isKeepInTouchFrequency(frequency)) {
    return null;
  }

  const lastConversation = candidate.latestNoteAt ?? candidate.frequencySetAt;

  if (!lastConversation) {
    return null;
  }

  const overdueMs =
    now.getTime() -
    (lastConversation.getTime() + KEEP_IN_TOUCH_PERIOD_DAYS[frequency] * MS_PER_DAY);

  if (overdueMs <= 0) {
    return null;
  }

  return {
    frequency,
    overdueMs,
    overdueDays: Math.max(1, Math.floor(overdueMs / MS_PER_DAY)),
  };
}

function daysWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "день";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "дня";
  }

  return "дней";
}
