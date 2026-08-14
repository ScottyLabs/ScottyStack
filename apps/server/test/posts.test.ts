import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.ts";
import { postService } from "../src/services/postService.ts";
import { adminAuth, alice, aliceAuth, bobAuth, seedAdmin, seedAlice, seedBob } from "./fixtures.ts";

const guest = { id: "", role: "guest" as const };
const missingId = "00000000-0000-0000-0000-000000000001";

describe("POST /posts", () => {
  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/posts").send({
      title: "Hello",
      content: "World",
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ name: "Unauthenticated" });
  });

  it("returns 401 when the Bearer token is malformed", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", "Bearer not-a-jwt")
      .send({ title: "Hello", content: "World" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ name: "Unauthenticated" });
  });

  it("returns 201 and the created post when authenticated", async () => {
    await seedAlice();

    const res = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Hello",
      content: "World",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Hello",
      content: "World",
      userId: alice.id,
    });
  });

  it("returns 422 when the body is empty", async () => {
    await seedAlice();

    const res = await request(app).post("/posts").set(aliceAuth()).send({});

    expect(res.status).toBe(422);
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

  it("returns 400 for an unknown cursor", async () => {
    const res = await request(app).get(`/posts`).query({ cursor: missingId });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: "Invalid cursor" });
  });

  it("pages with nextCursor when limit is 1 and two posts exist", async () => {
    await seedAlice();
    const first = await request(app).post("/posts").set(aliceAuth()).send({
      title: "First",
      content: "A",
    });
    const second = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Second",
      content: "B",
    });
    const createdIds = [first.body.id, second.body.id];

    const page1 = await request(app).get("/posts").query({ limit: 1 });
    expect(page1.status).toBe(200);
    expect(page1.body.posts).toHaveLength(1);
    expect(page1.body.nextCursor).toEqual(expect.any(String));
    expect(createdIds).toContain(page1.body.posts[0].id);

    const page2 = await request(app).get("/posts").query({
      limit: 1,
      cursor: page1.body.nextCursor,
    });
    expect(page2.status).toBe(200);
    expect(page2.body.posts).toHaveLength(1);
    expect(page2.body.nextCursor).toBeNull();
    expect(createdIds).toContain(page2.body.posts[0].id);
    expect(page2.body.posts[0].id).not.toBe(page1.body.posts[0].id);
  });
});

describe("GET /posts/:postId", () => {
  it("returns 404 when the post does not exist", async () => {
    const res = await request(app).get(`/posts/${missingId}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ message: "Post not found" });
  });

  it("returns 200 with the post title after create", async () => {
    await seedAlice();
    const created = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Hello",
      content: "World",
    });

    const res = await request(app).get(`/posts/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "Hello", content: "World" });
  });

  it("masks an anonymous author for a stranger and reveals it to an admin", async () => {
    await seedAlice();
    await seedBob();
    await seedAdmin();
    const created = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Secret",
      content: "Hidden",
      anonymous: true,
    });

    const stranger = await request(app).get(`/posts/${created.body.id}`).set(bobAuth());
    expect(stranger.status).toBe(200);
    expect(stranger.body.authorName).toBe("Anonymous");

    const admin = await request(app).get(`/posts/${created.body.id}`).set(adminAuth());
    expect(admin.status).toBe(200);
    expect(admin.body.authorName).toBe(alice.name);
  });
});

describe("PATCH /posts/:postId", () => {
  it("returns 200 when the owner updates their post", async () => {
    await seedAlice();
    const created = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Hello",
      content: "World",
    });

    const res = await request(app).patch(`/posts/${created.body.id}`).set(aliceAuth()).send({
      title: "Updated",
      content: "World",
      anonymous: false,
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "Updated" });
  });

  it("returns 403 when another user updates the post", async () => {
    await seedAlice();
    await seedBob();
    const created = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Hello",
      content: "World",
    });

    const res = await request(app).patch(`/posts/${created.body.id}`).set(bobAuth()).send({
      title: "Hijack",
      content: "World",
      anonymous: false,
    });

    expect(res.status).toBe(403);
  });

  it("returns 404 when the post does not exist", async () => {
    await seedAlice();

    const res = await request(app).patch(`/posts/${missingId}`).set(aliceAuth()).send({
      title: "Updated",
      content: "World",
      anonymous: false,
    });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ message: "Post not found" });
  });
});

describe("DELETE /posts/:postId", () => {
  it("returns 403 when the owner is not an admin", async () => {
    await seedAlice();
    const created = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Hello",
      content: "World",
    });

    const res = await request(app).delete(`/posts/${created.body.id}`).set(aliceAuth());

    expect(res.status).toBe(403);
  });

  it("returns 204 for an admin and the post is then gone", async () => {
    await seedAlice();
    await seedAdmin();
    const created = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Hello",
      content: "World",
    });

    const deleted = await request(app).delete(`/posts/${created.body.id}`).set(adminAuth());
    expect(deleted.status).toBe(204);

    const fetched = await request(app).get(`/posts/${created.body.id}`);
    expect(fetched.status).toBe(404);
  });
});
