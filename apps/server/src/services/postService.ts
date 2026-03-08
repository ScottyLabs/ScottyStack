import { and, asc, desc, eq, lt, or } from "drizzle-orm";
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
        userId: reply.userId,
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
        userId: r.userId,
        content: r.content,
        authorName: maskAuthor(r.anonymous, r.authorName, isAdmin),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  },

  listPosts: async (
    isAdmin: boolean,
    limit: number = 20,
    cursor?: string,
  ): Promise<{
    posts: Array<{
      id: string;
      userId: string;
      title: string;
      content: string;
      updatedAt: Date;
      authorName: string;
    }>;
    nextCursor: string | null;
  }> => {
    const pageSize = Math.min(Math.max(1, limit), 100);

    type Row = {
      id: string;
      userId: string;
      title: string;
      content: string;
      updatedAt: Date;
      authorName: string | null;
      anonymous: boolean;
    };

    let rows: Row[];

    const hasCursor = cursor && cursor.trim() !== "";
    if (hasCursor) {
      const [cursorPost] = await db
        .select({ id: post.id, createdAt: post.createdAt })
        .from(post)
        .where(eq(post.id, cursor));
      if (!cursorPost) {
        throw new HttpError(400, "Invalid cursor");
      }
      rows = await db
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
        .where(
          or(
            lt(post.createdAt, cursorPost.createdAt),
            and(
              eq(post.createdAt, cursorPost.createdAt),
              lt(post.id, cursorPost.id),
            ),
          ),
        )
        .orderBy(desc(post.createdAt), desc(post.id))
        .limit(pageSize + 1);
    } else {
      rows = await db
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
        .orderBy(desc(post.createdAt), desc(post.id))
        .limit(pageSize + 1);
    }

    const hasMore = rows.length > pageSize;
    const slice = hasMore ? rows.slice(0, pageSize) : rows;
    const lastRow = slice[slice.length - 1];
    const posts = slice.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      content: row.content,
      updatedAt: row.updatedAt,
      authorName: maskAuthor(row.anonymous, row.authorName, isAdmin),
    }));
    const nextCursor = hasMore && lastRow ? lastRow.id : null;

    return { posts, nextCursor };
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

  deletePost: async (providerId: string, postId: string, isAdmin: boolean) => {
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
    if (!isAdmin && existing.userId !== userRecord.id) {
      throw new HttpError(403, "Forbidden: you can only delete your own posts");
    }

    await db.delete(post).where(eq(post.id, postId));
  },

  deleteReply: async (
    providerId: string,
    postId: string,
    replyId: string,
    isAdmin: boolean,
  ) => {
    const userRecord = await userService.getUserByAccountId(providerId);
    if (!userRecord) {
      throw new HttpError(404, "User not found");
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
    if (!isAdmin && existing.userId !== userRecord.id) {
      throw new HttpError(
        403,
        "Forbidden: you can only delete your own replies",
      );
    }

    await db.delete(reply).where(eq(reply.id, replyId));
  },
};
