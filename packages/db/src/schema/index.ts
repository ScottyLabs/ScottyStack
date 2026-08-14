export * from "./auth.ts";
export * from "./posts.ts";

import type { account, session, user, verification } from "./auth.ts";
import type { post, reply } from "./posts.ts";

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
export type Reply = typeof reply.$inferSelect;
export type NewReply = typeof reply.$inferInsert;
