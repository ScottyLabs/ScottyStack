import { describe, expect, it } from "vitest";

import { replyService } from "../src/services/replyService.ts";

const guest = { id: "", role: "guest" as const };

describe("createReply", () => {
  it("rejects a guest", async () => {
    await expect(
      replyService.createReply(guest, "00000000-0000-0000-0000-000000000001", "Hi"),
    ).rejects.toMatchObject({
      status: 403,
    });
  });
});
