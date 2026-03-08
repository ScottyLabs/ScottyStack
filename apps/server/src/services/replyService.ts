import type { User } from "@scottystack/access-control";
import { hasPermission } from "@scottystack/access-control";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { post, reply } from "../db/schema/posts.ts";
import { HttpError } from "../middlewares/errorHandler.ts";

export const replyService = {
  createReply: async (
    acUser: User,
    postId: string,
    content: string,
    anonymous: boolean = false,
  ) => {
    const [existingPost] = await db
      .select({ id: post.id })
      .from(post)
      .where(eq(post.id, postId));
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

    if (!hasPermission(acUser, "replies", "delete", existing)) {
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

    if (!hasPermission(acUser, "replies", "update", existing)) {
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
