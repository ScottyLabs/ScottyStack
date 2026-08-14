export const API_URL = "http://localhost:3001";

export const samplePost = {
  id: "post-1",
  userId: "alice",
  title: "Hello stack",
  content: "Body",
  anonymous: false,
  private: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  authorName: "Alice",
  replies: [] as Array<{
    id: string;
    userId: string;
    content: string;
    anonymous: boolean;
    authorName: string;
    createdAt: string;
    updatedAt: string;
  }>,
};

export function userSession(role: "user" | "admin" = "user") {
  return {
    user: {
      id: "alice",
      name: "Alice",
      email: "alice@cmu.edu",
      emailVerified: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      role,
    },
    session: {
      id: "sess-1",
      expiresAt: "2027-01-01T00:00:00.000Z",
      token: "tok",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      userId: "alice",
    },
  };
}
