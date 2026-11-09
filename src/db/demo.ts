import { count, eq } from "drizzle-orm";

import { db } from "./index";
import { contacts, notes, user } from "./schema";

const femaleFirstNames = [
  "Анна",
  "Мария",
  "Елена",
  "Ольга",
  "Ирина",
  "Наталья",
  "Светлана",
  "Татьяна",
  "Екатерина",
  "Юлия",
  "Софья",
  "Алина",
  "Дарья",
  "Полина",
  "Виктория",
  "Ксения",
  "Марина",
  "Вера",
  "Людмила",
  "Галина",
];

const maleFirstNames = [
  "Александр",
  "Дмитрий",
  "Сергей",
  "Андрей",
  "Алексей",
  "Михаил",
  "Иван",
  "Павел",
  "Николай",
  "Владимир",
  "Артём",
  "Кирилл",
  "Максим",
  "Роман",
  "Егор",
  "Илья",
  "Олег",
  "Виктор",
  "Борис",
  "Григорий",
];

const femaleLastNames = [
  "Иванова",
  "Смирнова",
  "Кузнецова",
  "Попова",
  "Васильева",
  "Петрова",
  "Соколова",
  "Михайлова",
  "Новикова",
  "Фёдорова",
  "Морозова",
  "Волкова",
  "Алексеева",
  "Лебедева",
  "Семёнова",
  "Егорова",
  "Павлова",
  "Козлова",
  "Степанова",
  "Николаева",
  "Орлова",
  "Андреева",
  "Макарова",
  "Никитина",
  "Захарова",
];

const maleLastNames = [
  "Иванов",
  "Смирнов",
  "Кузнецов",
  "Попов",
  "Васильев",
  "Петров",
  "Соколов",
  "Михайлов",
  "Новиков",
  "Фёдоров",
  "Морозов",
  "Волков",
  "Алексеев",
  "Лебедев",
  "Семёнов",
  "Егоров",
  "Павлов",
  "Козлов",
  "Степанов",
  "Николаев",
  "Орлов",
  "Андреев",
  "Макаров",
  "Никитин",
  "Захаров",
];

const metThrough = [
  "университет",
  "работа",
  "школа",
  "соседи",
  "друзья",
  "конференция",
  "спорт",
  "родня",
  "кружок",
  "путешествие",
];

const agreements = [
  "Созвониться на следующей неделе",
  "Встретиться за кофе",
  "Прислать фотографии со встречи",
  "Вернуть книгу",
  "Помочь с переездом",
  null,
  null,
  null,
];

function phone(index: number) {
  const part = String(1000000 + index).slice(-7);
  return `+7 9${String(index % 100).padStart(2, "0")} ${part.slice(0, 3)}-${part.slice(3, 5)}-${part.slice(5, 7)}`;
}

export function demoContacts(total: number) {
  const half = Math.ceil(total / 2);

  return Array.from({ length: total }, (_, index) => {
    const female = index < half;
    const firstNames = female ? femaleFirstNames : maleFirstNames;
    const lastNames = female ? femaleLastNames : maleLastNames;
    const localIndex = female ? index : index - half;
    const firstName = firstNames[localIndex % firstNames.length];
    const lastName = lastNames[Math.floor(localIndex / firstNames.length) % lastNames.length];

    return {
      name: `${firstName} ${lastName}`,
      metThrough: metThrough[index % metThrough.length],
      phone: index % 7 === 0 ? null : phone(index),
      email: index % 11 === 0 ? null : `contact.${String(index + 1).padStart(4, "0")}@example.com`,
      agreement: agreements[index % agreements.length],
    };
  });
}

export type SeedResult =
  | { status: "seeded"; ownerId: string; contacts: number; notes: number }
  | { status: "skipped"; ownerId: string; contacts: number; notes: 0 };

// Demo data always belongs to the owner from settings; the address is never chosen here.
export async function seedDemoData(input: {
  ownerEmail: string;
  count: number;
}): Promise<SeedResult> {
  const ownerEmail = input.ownerEmail.trim().toLowerCase();

  if (!ownerEmail) {
    throw new Error("OWNER_EMAIL is not set");
  }

  const [existingOwner] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, ownerEmail))
    .limit(1);
  const ownerId = existingOwner?.id ?? crypto.randomUUID();

  if (!existingOwner) {
    await db
      .insert(user)
      .values({ id: ownerId, name: ownerEmail, email: ownerEmail, emailVerified: true });
  }

  const [{ value }] = await db
    .select({ value: count() })
    .from(contacts)
    .where(eq(contacts.userId, ownerId));

  if (value > 0) {
    return { status: "skipped", ownerId, contacts: value, notes: 0 };
  }

  const created = await db
    .insert(contacts)
    .values(demoContacts(input.count).map((row) => ({ ...row, userId: ownerId })))
    .returning({ id: contacts.id, name: contacts.name });

  const noteRows = created
    .filter((_, index) => index % 10 === 0)
    .map((contact) => ({
      contactId: contact.id,
      body: `Поговорили с ${contact.name}. Договорились написать, как появятся новости.`,
    }));

  if (noteRows.length > 0) {
    await db.insert(notes).values(noteRows);
  }

  return { status: "seeded", ownerId, contacts: created.length, notes: noteRows.length };
}
