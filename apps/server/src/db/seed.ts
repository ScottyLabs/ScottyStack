/**
 * Seed in 4 batches using drizzle-seed:
 * 1. 3 users with no posts
 * 2. 5 users with posts that have no replies
 * 3. 7 users with posts that have replies
 * 4. 1 user who only replies (no posts)
 *
 * Run: bun run db:seed
 */
import { eq } from "drizzle-orm";
import { getGeneratorsFunctions, reset, seed } from "drizzle-seed";
import { db } from "./index.ts";
import { user } from "./schema/auth.ts";
import { post, reply } from "./schema/posts.ts";

const schema = { user, post, reply };

const SEED = 42;

async function main() {
  await reset(db, schema);

  // Batch 1: 3 users with no posts
  const emailGen1 = getGeneratorsFunctions().email();
  emailGen1.init({ count: 3, seed: SEED });
  const emails1 = Array.from({ length: 3 }, () => emailGen1.generate());
  await seed(db, schema, { count: 3, seed: SEED }).refine((f) => ({
    user: {
      count: 3,
      columns: {
        id: f.uuid(),
        name: f.fullName(),
        email: f.valuesFromArray({ values: emails1, isUnique: true }),
        fullEmail: f.valuesFromArray({ values: emails1, isUnique: true }),
        emailVerified: f.default({ defaultValue: false }),
        image: f.default({ defaultValue: null }),
        createdAt: f.timestamp(),
        updatedAt: f.timestamp(),
      },
    },
  }));

  // Batch 2: 5 users with posts that have no replies
  const emailGen2 = getGeneratorsFunctions().email();
  emailGen2.init({ count: 5, seed: SEED + 1 });
  const emails2 = Array.from({ length: 5 }, () => emailGen2.generate());
  await seed(db, schema, { count: 5, seed: SEED + 100 }).refine((f) => ({
    user: {
      count: 5,
      columns: {
        id: f.uuid(),
        name: f.fullName(),
        email: f.valuesFromArray({ values: emails2, isUnique: true }),
        fullEmail: f.valuesFromArray({ values: emails2, isUnique: true }),
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
    },
  }));

  // Batch 3: 7 users with posts that have replies
  const emailGen3 = getGeneratorsFunctions().email();
  emailGen3.init({ count: 7, seed: SEED + 2 });
  const emails3 = Array.from({ length: 7 }, () => emailGen3.generate());
  await seed(db, schema, { count: 7, seed: SEED + 200 }).refine((f) => ({
    user: {
      count: 7,
      columns: {
        id: f.uuid(),
        name: f.fullName(),
        email: f.valuesFromArray({ values: emails3, isUnique: true }),
        fullEmail: f.valuesFromArray({ values: emails3, isUnique: true }),
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
          { weight: 0.5, count: 1 },
          { weight: 0.5, count: [2, 3] },
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

  // Batch 4: 1 user who only replies (no posts)
  const REPLY_ONLY_EMAIL = "seed-reply-only@example.com";
  await seed(db, schema, { count: 1, seed: SEED + 300 }).refine((f) => ({
    user: {
      count: 1,
      columns: {
        id: f.uuid(),
        name: f.fullName(),
        email: f.valuesFromArray({
          values: [REPLY_ONLY_EMAIL],
          isUnique: true,
        }),
        fullEmail: f.valuesFromArray({
          values: [REPLY_ONLY_EMAIL],
          isUnique: true,
        }),
        emailVerified: f.default({ defaultValue: false }),
        image: f.default({ defaultValue: null }),
        createdAt: f.timestamp(),
        updatedAt: f.timestamp(),
      },
    },
  }));

  // Add replies from the reply-only user to existing posts
  const replyOnlyUser = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, REPLY_ONLY_EMAIL))
    .limit(1);
  const posts = await db.select({ id: post.id }).from(post).limit(4);

  const replyOnly = replyOnlyUser[0];
  if (replyOnly && posts.length > 0) {
    const f = getGeneratorsFunctions();
    const contentGen = f.loremIpsum();
    const anonymousGen = f.boolean();
    contentGen.init({ count: posts.length, seed: 42 });
    anonymousGen.init({ count: posts.length, seed: 43 });
    const now = new Date();
    await db.insert(reply).values(
      posts.map((p) => ({
        userId: replyOnly.id,
        postId: p.id,
        content: contentGen.generate(),
        anonymous: anonymousGen.generate(),
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  console.log(
    "Seeded: 3 users (no posts), 5 users (posts, no replies), 7 users (posts with replies), 1 user (replies only).",
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
