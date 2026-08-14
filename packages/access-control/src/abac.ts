// References:
// - https://github.com/WebDevSimplified/casl-crash-course/blob/main/src/lib/permissions/getUserPermissions.ts

import { AbilityBuilder, createMongoAbility, type MongoAbility } from "@casl/ability";

import type { PostSubject, ReplySubject, User } from "./types.ts";

export type Action = "read" | "readAuthor" | "create" | "update" | "delete";
export type SubjectName = "Post" | "Reply";
export type Permission = [Action, PostSubject | "Post"] | [Action, ReplySubject | "Reply"];
export type AppAbility = MongoAbility<Permission>;

export function getUserAbility(user: User): AppAbility {
  const { build, can: allow } = new AbilityBuilder<AppAbility>(createMongoAbility);

  allow("read", "Post", { private: false });
  allow("read", "Reply");

  if (user.role === "user" || user.role === "admin") {
    allow("read", "Post", { userId: user.id });
    allow("create", "Post");
    allow("create", "Reply");
    allow("update", "Post", { userId: user.id });
    allow("update", "Reply", { userId: user.id });
  }

  if (user.role === "admin") {
    allow("read", "Post");
    allow("readAuthor", "Post");
    allow("readAuthor", "Reply");
    allow("delete", "Post");
    allow("delete", "Reply");
  }

  return build();
}
