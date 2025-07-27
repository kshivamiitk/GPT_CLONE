import {pgTable, serial , uuid, text , varchar, timestamp} from "drizzle-orm/pg-core";

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id'),
    role: varchar('role', { length: 12 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});