import { count } from "drizzle-orm";

import { db } from "./index";
import { contacts, notes } from "./schema";

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

async function seed() {
  const [{ value }] = await db.select({ value: count() }).from(contacts);

  if (value > 0) {
    console.log(`Seed skipped: contacts table already has ${value} rows`);
    process.exit(0);
  }

  const rows = Array.from({ length: 1000 }, (_, index) => {
    const female = index < 500;
    const firstNames = female ? femaleFirstNames : maleFirstNames;
    const lastNames = female ? femaleLastNames : maleLastNames;
    const localIndex = female ? index : index - 500;
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

  const created = await db.insert(contacts).values(rows).returning({ id: contacts.id, name: contacts.name });

  const noteRows = created
    .filter((_, index) => index % 10 === 0)
    .map((contact) => ({
      contactId: contact.id,
      body: `Поговорили с ${contact.name}. Договорились написать, как появятся новости.`,
    }));

  await db.insert(notes).values(noteRows);
  console.log(`Seeded ${created.length} contacts and ${noteRows.length} notes`);
  process.exit(0);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
