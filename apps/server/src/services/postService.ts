import type { User } from "@scottystack/access-control";
import {
  canCreatePost,
  canDeletePost,
  canReadPostAuthor,
  canReadReplyAuthor,
  canUpdatePost,
} from "@scottystack/access-control";
import { drizzleWhere } from "@scottystack/access-control/drizzle";
import { post, reply, user } from "@scottystack/db/schema";
import { and, asc, desc, eq, lt, or } from "drizzle-orm";

import { db } from "../lib/db.ts";
import { HttpError } from "../middlewares/errorHandler.ts";

function maskAuthor(anonymous: boolean, authorName: string | null, canViewName: boolean) {
  if (canViewName || !anonymous) return authorName ?? "User";
  return "Anonymous";
}

function postReadWhere(acUser: User) {
  return drizzleWhere("read", "Post", acUser, post);
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
        private: post.private,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        authorName: user.name,
      })
      .from(post)
      .innerJoin(user, eq(post.userId, user.id))
      .where(and(eq(post.id, id), postReadWhere(acUser)));
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

    const canViewPostName = canReadPostAuthor({ user: acUser, post: row });
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      content: row.content,
      anonymous: row.anonymous,
      private: row.private,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      authorName: maskAuthor(row.anonymous, row.authorName, canViewPostName),
      replies: replies.map((r) => {
        const canViewReplyName = canReadReplyAuthor({ user: acUser, reply: r });
        return {
          id: r.id,
          userId: r.userId,
          content: r.content,
          anonymous: r.anonymous,
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
      private: boolean;
      createdAt: Date;
      updatedAt: Date;
      authorName: string;
    }>;
    nextCursor: string | null;
  }> => {
    const pageSize = Math.min(Math.max(1, limit), 100);
    const readFilter = postReadWhere(acUser);

    type Row = {
      id: string;
      userId: string;
      title: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      authorName: string | null;
      anonymous: boolean;
      private: boolean;
    };

    let rows: Row[];

    const hasCursor = cursor && cursor.trim() !== "";
    if (hasCursor) {
      const [cursorPost] = await db
        .select({ id: post.id, createdAt: post.createdAt })
        .from(post)
        .where(and(eq(post.id, cursor), readFilter));
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
          private: post.private,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorName: user.name,
        })
        .from(post)
        .innerJoin(user, eq(post.userId, user.id))
        .where(
          and(
            or(
              lt(post.createdAt, cursorPost.createdAt),
              and(eq(post.createdAt, cursorPost.createdAt), lt(post.id, cursorPost.id)),
            ),
            readFilter,
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
          private: post.private,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorName: user.name,
        })
        .from(post)
        .innerJoin(user, eq(post.userId, user.id))
        .where(readFilter)
        .orderBy(desc(post.createdAt), desc(post.id))
        .limit(pageSize + 1);
    }

    const hasMore = rows.length > pageSize;
    const slice = hasMore ? rows.slice(0, pageSize) : rows;
    const lastRow = slice[slice.length - 1];
    const posts = slice.map((row) => {
      const canViewName = canReadPostAuthor({ user: acUser, post: row });
      return {
        id: row.id,
        userId: row.userId,
        title: row.title,
        content: row.content,
        private: row.private,
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
    isPrivate: boolean = false,
  ) => {
    if (!canCreatePost({ user: acUser })) {
      throw new HttpError(403, "You are not allowed to create a post");
    }

    const now = new Date();
    const [created] = await db
      .insert(post)
      .values({
        userId: acUser.id,
        title,
        content,
        anonymous,
        private: isPrivate,
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
    isPrivate: boolean,
  ) => {
    const [existing] = await db
      .select({ id: post.id, userId: post.userId, private: post.private })
      .from(post)
      .where(and(eq(post.id, postId), postReadWhere(acUser)));
    if (!existing) {
      throw new HttpError(404, "Post not found");
    }

    if (!canUpdatePost({ user: acUser, post: existing })) {
      throw new HttpError(403, "You are not allowed to update this post");
    }

    const now = new Date();
    const [updated] = await db
      .update(post)
      .set({ title, content, anonymous, private: isPrivate, updatedAt: now })
      .where(eq(post.id, postId))
      .returning();

    return updated;
  },

  deletePost: async (acUser: User, postId: string) => {
    const [existing] = await db
      .select({ id: post.id, userId: post.userId, private: post.private })
      .from(post)
      .where(and(eq(post.id, postId), postReadWhere(acUser)));
    if (!existing) {
      throw new HttpError(404, "Post not found");
    }

    if (!canDeletePost({ user: acUser, post: existing })) {
      throw new HttpError(403, "You are not allowed to delete this post");
    }

    await db.delete(post).where(eq(post.id, postId));
  },
};
