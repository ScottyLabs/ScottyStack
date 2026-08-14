import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { userSession } from "./fixtures.ts";
import { setSession } from "./msw/handlers.ts";
import { renderApp } from "./render.tsx";

describe("NewPostForm", () => {
  it("shows Title is required when submitting empty", async () => {
    setSession(userSession("user"));
    const user = userEvent.setup();
    await renderApp("/new");

    expect(await screen.findByRole("heading", { name: "New Post" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Post" }));

    expect(await screen.findByText("Title is required")).toBeDefined();
  });
});
