import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema/auth.ts";
import { post, reply } from "../db/schema/posts.ts";
import { HttpError } from "../middlewares/errorHandler.ts";
import { userService } from "./userService.ts";

function maskAuthor(
  anonymous: boolean,
  authorName: string | null,
  isAdmin: boolean,
) {
  if (isAdmin || !anonymous) return authorName ?? "User";
  return "Anonymous";
}

export const postService = {
  getPostById: async (id: string, isAdmin: boolean) => {
    const [row] = await db
      .select({
        id: post.id,
        userId: post.userId,
        title: post.title,
        content: post.content,
        anonymous: post.anonymous,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        authorName: user.name,
      })
      .from(post)
      .innerJoin(user, eq(post.userId, user.id))
      .where(eq(post.id, id));
    if (!row) {
      throw new HttpError(404, "Post not found");
    }

    const replies = await db
      .select({
        id: reply.id,
        content: reply.content,
        anonymous: reply.anonymous,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        authorName: user.name,
      })
      .from(reply)
      .innerJoin(user, eq(reply.userId, user.id))
      .where(eq(reply.postId, id))
      .orderBy(asc(reply.createdAt));

    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      content: row.content,
      anonymous: row.anonymous,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      authorName: maskAuthor(row.anonymous, row.authorName, isAdmin),
      replies: replies.map((r) => ({
        id: r.id,
        content: r.content,
        authorName: maskAuthor(r.anonymous, r.authorName, isAdmin),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  },

  listPosts: async (isAdmin: boolean) => {
    const rows = await db
      .select({
        id: post.id,
        userId: post.userId,
        title: post.title,
        content: post.content,
        anonymous: post.anonymous,
        updatedAt: post.updatedAt,
        authorName: user.name,
      })
      .from(post)
      .innerJoin(user, eq(post.userId, user.id))
      .orderBy(desc(post.createdAt));

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      content: row.content,
      updatedAt: row.updatedAt,
      authorName: maskAuthor(row.anonymous, row.authorName, isAdmin),
    }));
  },

  createPost: async (
    providerId: string,
    title: string,
    content: string,
    anonymous: boolean = false,
  ) => {
    const userRecord = await userService.getUserByAccountId(providerId);
    if (!userRecord) {
      throw new HttpError(404, "User not found");
    }

    const now = new Date();
    const [created] = await db
      .insert(post)
      .values({
        userId: userRecord.id,
        title,
        content,
        anonymous,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  },

  updatePost: async (
    providerId: string,
    postId: string,
    title: string,
    content: string,
    anonymous: boolean,
  ) => {
    const userRecord = await userService.getUserByAccountId(providerId);
    if (!userRecord) {
      throw new HttpError(404, "User not found");
    }

    const [existing] = await db
      .select({ id: post.id, userId: post.userId })
      .from(post)
      .where(eq(post.id, postId));
    if (!existing) {
      throw new HttpError(404, "Post not found");
    }
    if (existing.userId !== userRecord.id) {
      throw new HttpError(403, "Forbidden: you can only edit your own posts");
    }

    const now = new Date();
    const [updated] = await db
      .update(post)
      .set({ title, content, anonymous, updatedAt: now })
      .where(eq(post.id, postId))
      .returning();

    return updated;
  },

  createReply: async (
    providerId: string,
    postId: string,
    content: string,
    anonymous: boolean = false,
  ) => {
    const userRecord = await userService.getUserByAccountId(providerId);
    if (!userRecord) {
      throw new HttpError(404, "User not found");
    }

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
        userId: userRecord.id,
        postId,
        content,
        anonymous,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  },
};
