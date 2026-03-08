import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema/auth.ts";
import { post, reply } from "../db/schema/posts.ts";
import { HttpError } from "../middlewares/errorHandler.ts";
import { userService } from "./userService.ts";

export const postService = {
  getPostById: async (id: string) => {
    const [row] = await db
      .select({
        id: post.id,
        userId: post.userId,
        title: post.title,
        content: post.content,
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
      ...row,
      replies: replies.map((r) => ({
        id: r.id,
        content: r.content,
        authorName: r.anonymous ? "Anonymous" : r.authorName,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  },

  listPosts: async () => {
    return db
      .select({
        id: post.id,
        userId: post.userId,
        title: post.title,
        content: post.content,
        updatedAt: post.updatedAt,
        authorName: user.name,
      })
      .from(post)
      .innerJoin(user, eq(post.userId, user.id))
      .orderBy(desc(post.createdAt));
  },

  createPost: async (providerId: string, title: string, content: string) => {
    const user = await userService.getUserByAccountId(providerId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const now = new Date();
    const [created] = await db
      .insert(post)
      .values({
        userId: user.id,
        title,
        content,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  },
};
