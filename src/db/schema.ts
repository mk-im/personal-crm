import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const keepInTouchFrequencies = ["weekly", "monthly", "quarterly", "yearly"] as const;
export type KeepInTouchFrequency = (typeof keepInTouchFrequencies)[number];

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    metThrough: text("met_through"),
    phone: text("phone"),
    email: text("email"),
    agreement: text("agreement"),
    keepInTouchFrequency: text("keep_in_touch_frequency").$type<KeepInTouchFrequency>(),
    keepInTouchSetAt: timestamp("keep_in_touch_set_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("contacts_name_idx").on(table.name)],
);

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notes_contact_id_idx").on(table.contactId)],
);
