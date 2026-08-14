import { post } from "@scottystack/db/schema";
import { describe, expect, it } from "vitest";

import { drizzleWhere } from "../src/drizzle.ts";
import type { User } from "../src/types.ts";

const guest: User = { id: "", role: "guest" };
const alice: User = { id: "alice", role: "user" };
const admin: User = { id: "admin", role: "admin" };

describe("drizzleWhere", () => {
  it("returns no restriction for an admin reading posts", () => {
    expect(drizzleWhere("read", "Post", admin, post)).toBeUndefined();
  });

  it("returns a filter for a guest or user reading posts", () => {
    expect(drizzleWhere("read", "Post", guest, post)).toBeDefined();
    expect(drizzleWhere("read", "Post", alice, post)).toBeDefined();
  });
});
