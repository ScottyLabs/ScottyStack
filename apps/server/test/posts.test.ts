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

describe("private posts", () => {
  async function createPrivatePost() {
    await seedAlice();
    const created = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Secret",
      content: "Only me",
      private: true,
    });
    expect(created.status).toBe(201);
    expect(created.body.private).toBe(true);
    return created.body.id as string;
  }

  it("omits another user's private post from the list for guests and strangers", async () => {
    const postId = await createPrivatePost();
    await seedBob();

    const guestList = await request(app).get("/posts");
    expect(guestList.status).toBe(200);
    expect(guestList.body.posts.map((p: { id: string }) => p.id)).not.toContain(postId);

    const strangerList = await request(app).get("/posts").set(bobAuth());
    expect(strangerList.status).toBe(200);
    expect(strangerList.body.posts.map((p: { id: string }) => p.id)).not.toContain(postId);
  });

  it("includes the author's private post in the list and returns private on detail", async () => {
    const postId = await createPrivatePost();

    const list = await request(app).get("/posts").set(aliceAuth());
    expect(list.status).toBe(200);
    expect(list.body.posts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: postId, private: true })]),
    );

    const detail = await request(app).get(`/posts/${postId}`).set(aliceAuth());
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ title: "Secret", private: true });
  });

  it("lets an admin list and get another user's private post", async () => {
    const postId = await createPrivatePost();
    await seedAdmin();

    const list = await request(app).get("/posts").set(adminAuth());
    expect(list.status).toBe(200);
    expect(list.body.posts.map((p: { id: string }) => p.id)).toContain(postId);

    const detail = await request(app).get(`/posts/${postId}`).set(adminAuth());
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ title: "Secret", private: true });
  });

  it("returns 404 when a stranger or guest gets, patches, or deletes a private post", async () => {
    const postId = await createPrivatePost();
    await seedBob();

    const guestGet = await request(app).get(`/posts/${postId}`);
    expect(guestGet.status).toBe(404);

    const strangerGet = await request(app).get(`/posts/${postId}`).set(bobAuth());
    expect(strangerGet.status).toBe(404);

    const strangerPatch = await request(app).patch(`/posts/${postId}`).set(bobAuth()).send({
      title: "Hijack",
      content: "No",
      anonymous: false,
      private: false,
    });
    expect(strangerPatch.status).toBe(404);

    const strangerDelete = await request(app).delete(`/posts/${postId}`).set(bobAuth());
    expect(strangerDelete.status).toBe(404);
  });
});
