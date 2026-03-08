/**
 * Drizzle seed: 11+ users, 11+ posts.
 * Some posts are anonymous, some are not.
 * Some posts have replies, some don't.
 *
 * Run: bun run db:seed
 */
import { reset, seed } from "drizzle-seed";
import { db } from "./index.ts";
import { user } from "./schema/auth.ts";
import { post, reply } from "./schema/posts.ts";

const schema = { user, post, reply };

async function main() {
  await reset(db, schema);
  await seed(db, schema, { count: 11 }).refine((f) => ({
    user: {
      count: 11,
      columns: {
        id: f.string({ isUnique: true }),
        name: f.fullName(),
        email: f.email(),
        fullEmail: f.email(),
        emailVerified: f.default({ defaultValue: false }),
        image: f.default({ defaultValue: null }),
        createdAt: f.timestamp(),
        updatedAt: f.timestamp(),
      },
      with: { post: 1 },
    },
    post: {
      columns: {
        title: f.string(),
        content: f.loremIpsum(),
        anonymous: f.weightedRandom([
          { weight: 0.4, value: f.default({ defaultValue: true }) },
          { weight: 0.6, value: f.default({ defaultValue: false }) },
        ]),
        createdAt: f.timestamp(),
        updatedAt: f.timestamp(),
      },
      with: {
        reply: [
          { weight: 0.5, count: [0] },
          { weight: 0.5, count: [1, 2] },
        ],
      },
    },
    reply: {
      columns: {
        content: f.loremIpsum(),
        anonymous: f.boolean(),
        createdAt: f.timestamp(),
        updatedAt: f.timestamp(),
      },
    },
  }));

  console.log(
    "Seeded 11 users, 11 posts, and replies (some posts have replies, some don't).",
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
