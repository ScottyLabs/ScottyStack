import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { samplePost, userSession } from "./fixtures.ts";
import { setPosts, setSession } from "./msw/handlers.ts";
import { renderApp } from "./render.tsx";

describe("PostList", () => {
  it("shows the empty copy when there are no posts", async () => {
    await renderApp("/");

    expect(await screen.findByText("No posts yet. Stack one!")).toBeDefined();
  });

  it("shows a post title and navigates to the post on click", async () => {
    setPosts([samplePost]);
    const user = userEvent.setup();
    await renderApp("/");

    const link = await screen.findByRole("link", { name: /Hello stack/ });
    expect(link.getAttribute("href")).toBe("/post-1");
    await user.click(link);
    expect(await screen.findByText("Body", {}, { timeout: 5000 })).toBeDefined();
  });

  it("hides Stack! for guests and shows it when signed in", async () => {
    const { unmount } = await renderApp("/");
    expect(await screen.findByText("Sign in to create posts")).toBeDefined();
    expect(screen.queryByRole("link", { name: /Stack!/ })).toBeNull();
    unmount();

    setSession(userSession("user"));
    await renderApp("/");
    expect(await screen.findByRole("link", { name: /Stack!/ })).toBeDefined();
  });

  it("shows a Private label for a private post", async () => {
    setPosts([{ ...samplePost, private: true }]);
    await renderApp("/");

    expect(await screen.findByText("Private")).toBeDefined();
  });
});
