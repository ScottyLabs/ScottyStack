import { db } from "../db/index.ts";
import { post } from "../db/schema/posts.ts";

export const postService = {
  createPost: async (userId: string, title: string, content: string) => {
    const now = new Date();

    const [created] = await db
      .insert(post)
      .values({
        userId,
        title,
        content,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  },
};
