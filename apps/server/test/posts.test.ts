import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.ts";
import { postService } from "../src/services/postService.ts";

const guest = { id: "", role: "guest" as const };

describe("POST /posts", () => {
  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/posts").send({
      title: "Hello",
      content: "World",
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ name: "Unauthenticated" });
  });
});

describe("createPost", () => {
  it("rejects a guest", async () => {
    await expect(postService.createPost(guest, "Hello", "World")).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe("GET /posts", () => {
  it("returns an empty page when the database has no posts", async () => {
    const res = await request(app).get("/posts");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ posts: [], nextCursor: null });
  });
});
