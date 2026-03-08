import type { User } from "@scottystack/access-control";
import { hasPermission } from "@scottystack/access-control";
import { and, asc, desc, eq, lt, or } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema/auth.ts";
import { post, reply } from "../db/schema/posts.ts";
import { HttpError } from "../middlewares/errorHandler.ts";

function maskAuthor(
  anonymous: boolean,
  authorName: string | null,
  canViewName: boolean,
) {
  if (canViewName || !anonymous) return authorName ?? "User";
  return "Anonymous";
}

export const postService = {
  getPostById: async (acUser: User, id: string) => {
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

    const canViewPostName = hasPermission(acUser, "posts", "viewName", {
      userId: row.userId,
    });
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      content: row.content,
      anonymous: row.anonymous,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      authorName: maskAuthor(row.anonymous, row.authorName, canViewPostName),
      replies: replies.map((r) => {
        const canViewReplyName = hasPermission(acUser, "replies", "viewName", {
          userId: r.userId,
        });
        return {
          id: r.id,
          userId: r.userId,
          content: r.content,
          authorName: maskAuthor(r.anonymous, r.authorName, canViewReplyName),
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      }),
    };
  },

  listPosts: async (
    acUser: User,
    limit: number = 20,
    cursor?: string,
  ): Promise<{
    posts: Array<{
      id: string;
      userId: string;
      title: string;
      content: string;
      createdAt: Date;
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
      createdAt: Date;
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
          createdAt: post.createdAt,
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
          createdAt: post.createdAt,
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
    const posts = slice.map((row) => {
      const canViewName = hasPermission(acUser, "posts", "viewName", {
        userId: row.userId,
      });
      return {
        id: row.id,
        userId: row.userId,
        title: row.title,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        authorName: maskAuthor(row.anonymous, row.authorName, canViewName),
      };
    });
    const nextCursor = hasMore && lastRow ? lastRow.id : null;

    return { posts, nextCursor };
  },

  createPost: async (
    acUser: User,
    title: string,
    content: string,
    anonymous: boolean = false,
  ) => {
    const now = new Date();
    const [created] = await db
      .insert(post)
      .values({
        userId: acUser.id,
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
    acUser: User,
    postId: string,
    title: string,
    content: string,
    anonymous: boolean,
  ) => {
    const [existing] = await db
      .select({ id: post.id, userId: post.userId })
      .from(post)
      .where(eq(post.id, postId));
    if (!existing) {
      throw new HttpError(404, "Post not found");
    }

    if (!hasPermission(acUser, "posts", "update", existing)) {
      throw new HttpError(403, "You are not allowed to update this post");
    }

    const now = new Date();
    const [updated] = await db
      .update(post)
      .set({ title, content, anonymous, updatedAt: now })
      .where(eq(post.id, postId))
      .returning();

    return updated;
  },

  deletePost: async (acUser: User, postId: string) => {
    const [existing] = await db
      .select({ id: post.id, userId: post.userId })
      .from(post)
      .where(eq(post.id, postId));
    if (!existing) {
      throw new HttpError(404, "Post not found");
    }

    if (!hasPermission(acUser, "posts", "delete", existing)) {
      throw new HttpError(403, "You are not allowed to delete this post");
    }

    await db.delete(post).where(eq(post.id, postId));
  },
};
