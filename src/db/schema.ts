import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  bigint,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const filesTable = pgTable('files', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const linksTable = pgTable(
  'links',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
    fileId: integer('file_id')
      .references(() => filesTable.id, { onDelete: 'cascade' })
      .notNull(),
    token: text('token').notNull(),
    label: text('label').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    maxViews: integer('max_views'),
    views: integer('views').default(0).notNull(),
    burnAfterRead: boolean('burn_after_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('links_token_idx').on(table.token)],
);

export const usersRelations = relations(usersTable, ({ many }) => ({
  files: many(filesTable),
  links: many(linksTable),
}));

export const filesRelations = relations(filesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [filesTable.userId],
    references: [usersTable.id],
  }),
  links: many(linksTable),
}));

export const linksRelations = relations(linksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [linksTable.userId],
    references: [usersTable.id],
  }),
  file: one(filesTable, {
    fields: [linksTable.fileId],
    references: [filesTable.id],
  }),
}));
