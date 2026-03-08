import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { account, user } from "../db/schema/index.ts";

export const userService = {
  /**
   * Get a user by their account id from the identity provider.
   */
  getUserByAccountId: async (accountId: string) => {
    const rows = await db
      .select({ user })
      .from(user)
      .innerJoin(account, eq(user.id, account.userId))
      .where(eq(account.accountId, accountId));

    return rows[0]?.user;
  },
};
