import { desc } from "drizzle-orm";
import { db } from "../db/index.ts";
import { post } from "../db/schema/posts.ts";
import { HttpError } from "../middlewares/errorHandler.ts";
import { userService } from "./userService.ts";

export const postService = {
  listPosts: async () => {
    return db.select().from(post).orderBy(desc(post.createdAt));
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
