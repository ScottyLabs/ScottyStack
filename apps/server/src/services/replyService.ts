import type { User } from "@scottystack/access-control";
import { canCreateReply, canDeleteReply, canUpdateReply } from "@scottystack/access-control";
import { drizzleWhere } from "@scottystack/access-control/drizzle";
import { post, reply } from "@scottystack/db/schema";
import { and, eq } from "drizzle-orm";

import { db } from "../lib/db.ts";
import { HttpError } from "../middlewares/errorHandler.ts";

function readablePostWhere(acUser: User, postId: string) {
  return and(eq(post.id, postId), drizzleWhere("read", "Post", acUser, post));
}

export const replyService = {
  createReply: async (
    acUser: User,
    postId: string,
    content: string,
    anonymous: boolean = false,
  ) => {
    if (!canCreateReply({ user: acUser })) {
      throw new HttpError(403, "You are not allowed to create a reply");
    }

    const [existingPost] = await db
      .select({ id: post.id })
      .from(post)
      .where(readablePostWhere(acUser, postId));
    if (!existingPost) {
      throw new HttpError(404, "Post not found");
    }

    const now = new Date();
    const [created] = await db
      .insert(reply)
      .values({
        userId: acUser.id,
        postId,
        content,
        anonymous,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  },

  deleteReply: async (acUser: User, postId: string, replyId: string) => {
    const [parent] = await db
      .select({ id: post.id })
      .from(post)
      .where(readablePostWhere(acUser, postId));
    if (!parent) {
      throw new HttpError(404, "Post not found");
    }

    const [existing] = await db
      .select({ id: reply.id, userId: reply.userId, postId: reply.postId })
      .from(reply)
      .where(eq(reply.id, replyId));
    if (!existing) {
      throw new HttpError(404, "Reply not found");
    }
    if (existing.postId !== postId) {
      throw new HttpError(404, "Reply not found");
    }

    if (!canDeleteReply({ user: acUser, reply: existing })) {
      throw new HttpError(403, "You are not allowed to delete this reply");
    }

    await db.delete(reply).where(eq(reply.id, replyId));
  },

  updateReply: async (
    acUser: User,
    postId: string,
    replyId: string,
    content: string,
    anonymous: boolean,
  ) => {
    const [parent] = await db
      .select({ id: post.id })
      .from(post)
      .where(readablePostWhere(acUser, postId));
    if (!parent) {
      throw new HttpError(404, "Post not found");
    }

    const [existing] = await db
      .select({ id: reply.id, userId: reply.userId, postId: reply.postId })
      .from(reply)
      .where(eq(reply.id, replyId));
    if (!existing) {
      throw new HttpError(404, "Reply not found");
    }
    if (existing.postId !== postId) {
      throw new HttpError(404, "Reply not found");
    }

    if (!canUpdateReply({ user: acUser, reply: existing })) {
      throw new HttpError(403, "You are not allowed to update this reply");
    }

    const now = new Date();
    const [updated] = await db
      .update(reply)
      .set({ content, anonymous, updatedAt: now })
      .where(eq(reply.id, replyId))
      .returning();

    return updated;
  },
};
