import type { Post as DatabasePost, Reply as DatabaseReply } from "@scottystack/db/schema";

export type PostSubject = Pick<DatabasePost, "userId" | "private">;
export type ReplySubject = Pick<DatabaseReply, "userId">;

export type Role = "admin" | "user" | "guest";
export type User = { id: string; role: Role };
