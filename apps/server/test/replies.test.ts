import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.ts";
import { adminAuth, aliceAuth, bobAuth, seedAdmin, seedAlice, seedBob } from "./fixtures.ts";

const missingId = "00000000-0000-0000-0000-000000000001";

async function createPost() {
  await seedAlice();
  const res = await request(app).post("/posts").set(aliceAuth()).send({
    title: "Hello",
    content: "World",
  });
  return res.body.id as string;
}

describe("POST /posts/:postId/replies", () => {
  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).post(`/posts/${missingId}/replies`).send({ content: "Hi" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ name: "Unauthenticated" });
  });

  it("returns 201 when a user replies to an existing post", async () => {
    const postId = await createPost();

    const res = await request(app).post(`/posts/${postId}/replies`).set(aliceAuth()).send({
      content: "Nice post",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ content: "Nice post", postId });
  });

  it("returns 404 when the post does not exist", async () => {
    await seedAlice();

    const res = await request(app).post(`/posts/${missingId}/replies`).set(aliceAuth()).send({
      content: "Hi",
    });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ message: "Post not found" });
  });
});

describe("PATCH /posts/:postId/replies/:replyId", () => {
  it("returns 200 when the owner updates their reply", async () => {
    const postId = await createPost();
    const created = await request(app).post(`/posts/${postId}/replies`).set(aliceAuth()).send({
      content: "Hi",
    });

    const res = await request(app)
      .patch(`/posts/${postId}/replies/${created.body.id}`)
      .set(aliceAuth())
      .send({ content: "Edited", anonymous: false });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ content: "Edited" });
  });

  it("returns 403 when another user updates the reply", async () => {
    const postId = await createPost();
    await seedBob();
    const created = await request(app).post(`/posts/${postId}/replies`).set(aliceAuth()).send({
      content: "Hi",
    });

    const res = await request(app)
      .patch(`/posts/${postId}/replies/${created.body.id}`)
      .set(bobAuth())
      .send({ content: "Hijack", anonymous: false });

    expect(res.status).toBe(403);
  });

  it("returns 404 when the postId does not match the reply", async () => {
    const postId = await createPost();
    const other = await request(app).post("/posts").set(aliceAuth()).send({
      title: "Other",
      content: "Post",
    });
    const created = await request(app).post(`/posts/${postId}/replies`).set(aliceAuth()).send({
      content: "Hi",
    });

    const res = await request(app)
      .patch(`/posts/${other.body.id}/replies/${created.body.id}`)
      .set(aliceAuth())
      .send({ content: "Edited", anonymous: false });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /posts/:postId/replies/:replyId", () => {
  it("returns 403 when the owner is not an admin", async () => {
    const postId = await createPost();
    const created = await request(app).post(`/posts/${postId}/replies`).set(aliceAuth()).send({
      content: "Hi",
    });

    const res = await request(app)
      .delete(`/posts/${postId}/replies/${created.body.id}`)
      .set(aliceAuth());

    expect(res.status).toBe(403);
  });

  it("returns 204 for an admin", async () => {
    const postId = await createPost();
    await seedAdmin();
    const created = await request(app).post(`/posts/${postId}/replies`).set(aliceAuth()).send({
      content: "Hi",
    });

    const res = await request(app)
      .delete(`/posts/${postId}/replies/${created.body.id}`)
      .set(adminAuth());

    expect(res.status).toBe(204);
  });
});
