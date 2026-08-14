export * from "./auth.ts";
export * from "./posts.ts";

import type { post, reply } from "./posts.ts";

export type Post = typeof post.$inferSelect;
export type Reply = typeof reply.$inferSelect;
