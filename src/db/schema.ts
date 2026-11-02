import { sql } from "drizzle-orm";
import { index, integer, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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

export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("groups_name_lower_idx").on(sql`lower(${table.name})`)],
);

export const contactGroups = pgTable(
  "contact_groups",
  {
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.contactId, table.groupId] })],
);
