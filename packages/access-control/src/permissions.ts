import { subject } from "@casl/ability";

import { getUserAbility } from "./abac.ts";
import type { PostSubject, ReplySubject, User } from "./types.ts";

type UserInput = {
  user: User;
};

type PostInput = UserInput & {
  post: PostSubject;
};

type OptionalPostInput = UserInput & {
  post?: PostSubject;
};

type ReplyInput = UserInput & {
  reply: ReplySubject;
};

type OptionalReplyInput = UserInput & {
  reply?: ReplySubject;
};

export function canReadPost({ user, post }: OptionalPostInput) {
  const target = post ? subject("Post", post) : "Post";
  return getUserAbility(user).can("read", target);
}

export function canReadPostAuthor({ user, post }: PostInput) {
  return getUserAbility(user).can("readAuthor", subject("Post", post));
}

export function canCreatePost({ user }: UserInput) {
  return getUserAbility(user).can("create", "Post");
}

export function canUpdatePost({ user, post }: PostInput) {
  return getUserAbility(user).can("update", subject("Post", post));
}

export function canDeletePost({ user, post }: PostInput) {
  return getUserAbility(user).can("delete", subject("Post", post));
}

export function canReadReply({ user, reply }: OptionalReplyInput) {
  const target = reply ? subject("Reply", reply) : "Reply";
  return getUserAbility(user).can("read", target);
}

export function canReadReplyAuthor({ user, reply }: ReplyInput) {
  return getUserAbility(user).can("readAuthor", subject("Reply", reply));
}

export function canCreateReply({ user }: UserInput) {
  return getUserAbility(user).can("create", "Reply");
}

export function canUpdateReply({ user, reply }: ReplyInput) {
  return getUserAbility(user).can("update", subject("Reply", reply));
}

export function canDeleteReply({ user, reply }: ReplyInput) {
  return getUserAbility(user).can("delete", subject("Reply", reply));
}
