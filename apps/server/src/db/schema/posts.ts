import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const post = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    anonymous: boolean().notNull().default(false),
  },
  (table) => [index("post_userId_idx").on(table.userId)],
);

export const reply = pgTable(
  "reply",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    anonymous: boolean().notNull().default(false),
  },
  (table) => [
    index("reply_userId_idx").on(table.userId),
    index("reply_postId_idx").on(table.postId),
  ],
);

export const postRelations = relations(post, ({ one, many }) => ({
  user: one(user, {
    fields: [post.userId],
    references: [user.id],
  }),
  replies: many(reply),
}));

export const replyRelations = relations(reply, ({ one }) => ({
  user: one(user, {
    fields: [reply.userId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [reply.postId],
    references: [post.id],
  }),
}));
