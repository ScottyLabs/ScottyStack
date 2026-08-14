import { describe, expect, it } from "vitest";

import {
  canCreatePost,
  canCreateReply,
  canDeletePost,
  canDeleteReply,
  canReadPost,
  canReadPostAuthor,
  canReadReply,
  canReadReplyAuthor,
  canUpdatePost,
  canUpdateReply,
} from "../src/index.ts";
import type { User } from "../src/types.ts";

const guest: User = { id: "", role: "guest" };
const alice: User = { id: "alice", role: "user" };
const bob: User = { id: "bob", role: "user" };
const admin: User = { id: "admin", role: "admin" };

const alicesPost = { userId: alice.id, private: false };
const alicesPrivatePost = { userId: alice.id, private: true };
const alicesReply = { userId: alice.id };

describe("guest", () => {
  it("can read posts and replies", () => {
    expect(canReadPost({ user: guest })).toBe(true);
    expect(canReadReply({ user: guest })).toBe(true);
  });

  it("cannot create, update, delete, or readAuthor", () => {
    expect(canCreatePost({ user: guest })).toBe(false);
    expect(canCreateReply({ user: guest })).toBe(false);
    expect(canUpdatePost({ user: guest, post: alicesPost })).toBe(false);
    expect(canUpdateReply({ user: guest, reply: alicesReply })).toBe(false);
    expect(canDeletePost({ user: guest, post: alicesPost })).toBe(false);
    expect(canDeleteReply({ user: guest, reply: alicesReply })).toBe(false);
    expect(canReadPostAuthor({ user: guest, post: alicesPost })).toBe(false);
    expect(canReadReplyAuthor({ user: guest, reply: alicesReply })).toBe(false);
  });
});

describe("user", () => {
  it("can create posts and replies", () => {
    expect(canCreatePost({ user: alice })).toBe(true);
    expect(canCreateReply({ user: alice })).toBe(true);
  });

  it("can update their own posts and replies", () => {
    expect(canUpdatePost({ user: alice, post: alicesPost })).toBe(true);
    expect(canUpdateReply({ user: alice, reply: alicesReply })).toBe(true);
  });

  it("cannot update, delete, or readAuthor others' content", () => {
    expect(canUpdatePost({ user: bob, post: alicesPost })).toBe(false);
    expect(canUpdateReply({ user: bob, reply: alicesReply })).toBe(false);
    expect(canDeletePost({ user: alice, post: alicesPost })).toBe(false);
    expect(canDeleteReply({ user: alice, reply: alicesReply })).toBe(false);
    expect(canReadPostAuthor({ user: alice, post: alicesPost })).toBe(false);
    expect(canReadReplyAuthor({ user: alice, reply: alicesReply })).toBe(false);
  });
});

describe("private posts", () => {
  it("lets guests and strangers read public posts only", () => {
    expect(canReadPost({ user: guest, post: alicesPost })).toBe(true);
    expect(canReadPost({ user: guest, post: alicesPrivatePost })).toBe(false);
    expect(canReadPost({ user: bob, post: alicesPost })).toBe(true);
    expect(canReadPost({ user: bob, post: alicesPrivatePost })).toBe(false);
  });

  it("lets the author and an admin read a private post", () => {
    expect(canReadPost({ user: alice, post: alicesPrivatePost })).toBe(true);
    expect(canReadPost({ user: admin, post: alicesPrivatePost })).toBe(true);
  });
});

describe("admin", () => {
  it("can delete and readAuthor any content", () => {
    expect(canDeletePost({ user: admin, post: alicesPost })).toBe(true);
    expect(canDeleteReply({ user: admin, reply: alicesReply })).toBe(true);
    expect(canReadPostAuthor({ user: admin, post: alicesPost })).toBe(true);
    expect(canReadReplyAuthor({ user: admin, reply: alicesReply })).toBe(true);
  });

  it("can update only their own posts and replies", () => {
    expect(canUpdatePost({ user: admin, post: { userId: admin.id, private: false } })).toBe(true);
    expect(canUpdatePost({ user: admin, post: alicesPost })).toBe(false);
    expect(canUpdateReply({ user: admin, reply: { userId: admin.id } })).toBe(true);
    expect(canUpdateReply({ user: admin, reply: alicesReply })).toBe(false);
  });
});
