import { expect, test } from "@playwright/test";

import { signIn } from "./auth.ts";
import { adminUser, alice, resetDb, seedAdmin, seedAlice } from "./db.ts";

test.beforeEach(async () => {
  await resetDb();
});

test("a guest can browse an empty board", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Sign in to create posts")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Stack!/ })).toHaveCount(0);
  await expect(page.getByText("No posts yet. Stack one!")).toBeVisible();
  await expect(page.getByText("Select a post to view")).toBeVisible();
});

test("a signed-in user can create a post and reply to it", async ({ page, context }) => {
  await seedAlice();
  await signIn(context, alice.sessionToken);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "User menu" })).toBeVisible();

  await page.getByRole("link", { name: /Stack!/ }).click();
  await expect(page.getByRole("heading", { name: "New Post" })).toBeVisible();
  await page.getByLabel("Title").fill("Hello stack");
  await page.getByLabel("Content").fill("Body of the post");

  const created = page.waitForResponse(
    (res) => res.request().method() === "POST" && new URL(res.url()).pathname === "/posts",
  );
  await page.getByRole("button", { name: "Post" }).click();
  expect((await created).status()).toBe(201);

  await expect(page.getByRole("link", { name: /Hello stack/ })).toBeVisible();
  await page.getByRole("link", { name: /Hello stack/ }).click();

  await expect(page.getByRole("heading", { name: "Hello stack" })).toBeVisible();
  await expect(page.getByText("Body of the post")).toBeVisible();

  await page.getByPlaceholder("Write your reply...").fill("Nice post");
  const replied = page.waitForResponse(
    (res) => res.request().method() === "POST" && res.url().includes("/replies"),
  );
  await page.getByRole("button", { name: "Reply" }).click();
  expect((await replied).status()).toBe(201);

  await expect(page.getByText("Nice post")).toBeVisible();
  await expect(page.getByText("Replies (1)")).toBeVisible();
});

test("an admin can open the dashboard and see user counts", async ({ page, context }) => {
  await seedAlice();
  await seedAdmin();
  await signIn(context, adminUser.sessionToken);
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Alice", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "alice", exact: true })).toBeVisible();
});
