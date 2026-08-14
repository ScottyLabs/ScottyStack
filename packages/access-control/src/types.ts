import type { Post as DatabasePost, Reply as DatabaseReply } from "@scottystack/db/schema";

export type PostSubject = Pick<DatabasePost, "userId">;
export type ReplySubject = Pick<DatabaseReply, "userId">;

// Note that
// - An admin is also a user.
// - An admin is not a guest.
// - A user is not a guest.
export type Role = "admin" | "user" | "guest";
export type User = { id: string; roles: Role[] };
