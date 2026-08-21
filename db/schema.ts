import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const stamps = sqliteTable("stamps", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  country: text("country").notNull().default("Great Britain"),
  era: text("era").notNull(),
  issueYear: integer("issue_year"),
  issueYearEnd: integer("issue_year_end"),
  sgNumber: text("sg_number").notNull(),
  // condition: 'mint' | 'mounted_mint' | 'used' | 'fine_used'
  condition: text("condition").notNull(),
  grade: text("grade"),
  pricePence: integer("price_pence").notNull(),
  quantity: integer("quantity").notNull().default(1),
  // status: 'available' | 'reserved' | 'sold'
  status: text("status").notNull().default("available"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const stampImages = sqliteTable("stamp_images", {
  id: text("id").primaryKey(),
  stampId: text("stamp_id")
    .notNull()
    .references(() => stamps.id),
  r2Key: text("r2_key").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const stampTags = sqliteTable(
  "stamp_tags",
  {
    stampId: text("stamp_id")
      .notNull()
      .references(() => stamps.id),
    tag: text("tag").notNull(),
  },
  (table) => ({ pk: primaryKey({ columns: [table.stampId, table.tag] }) }),
);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull(),
  // status: 'pending' | 'paid' | 'cancelled'
  status: text("status").notNull().default("pending"),
  customerEmail: text("customer_email"),
  createdAt: integer("created_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  stampId: text("stamp_id")
    .notNull()
    .references(() => stamps.id),
  pricePence: integer("price_pence").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// NOTE: free-text search (title/description/sg_number) is intended to run
// via a SQLite FTS5 virtual table per SPEC.md §4. Drizzle doesn't model
// virtual tables directly — that table is created in a raw-SQL migration,
// and queried with `db.run(sql\`...\`)`. Not yet wired up; functions/ falls
// back to a plain LIKE query for now (see functions/api/[[route]].ts).
