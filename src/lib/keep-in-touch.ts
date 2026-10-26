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
