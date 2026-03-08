import { count, desc, inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema/index.ts";
import { post, reply } from "../db/schema/posts.ts";

export const userService = {
  /**
   * List users with post and reply counts (admin only). Paginated.
   */
  listUsers: async (options?: { page?: number; limit?: number }) => {
    const page = Math.max(0, options?.page ?? 0);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 10));

    const users = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(page * limit);

    if (users.length === 0) {
      return [];
    }

    const userIds = users.map((u) => u.id);

    const postCountRows = await db
      .select({
        userId: post.userId,
        postCount: count(post.id),
      })
      .from(post)
      .where(inArray(post.userId, userIds))
      .groupBy(post.userId);

    const replyCountRows = await db
      .select({
        userId: reply.userId,
        replyCount: count(reply.id),
      })
      .from(reply)
      .where(inArray(reply.userId, userIds))
      .groupBy(reply.userId);

    const postCountMap = new Map(
      postCountRows.map((r) => [r.userId, Number(r.postCount)]),
    );
    const replyCountMap = new Map(
      replyCountRows.map((r) => [r.userId, Number(r.replyCount)]),
    );

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      postCount: postCountMap.get(u.id) ?? 0,
      replyCount: replyCountMap.get(u.id) ?? 0,
    }));
  },
};
