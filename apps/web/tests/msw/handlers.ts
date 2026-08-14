import { http, HttpResponse } from "msw";

import { API_URL, samplePost } from "../fixtures.ts";

export let session: ReturnType<typeof import("../fixtures.ts").userSession> | null = null;
export let posts: Array<typeof samplePost> = [];
export let adminUsers: Array<{
  id: string;
  name: string;
  postCount: number;
  replyCount: number;
}> = [];

export function setSession(next: typeof session) {
  session = next;
}

export function setPosts(next: typeof posts) {
  posts = next;
}

export function setAdminUsers(next: typeof adminUsers) {
  adminUsers = next;
}

function param(value: string | readonly string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const handlers = [
  http.get(`${API_URL}/api/auth/*`, () => {
    return HttpResponse.json(session);
  }),
  http.post(`${API_URL}/api/auth/*`, () => {
    return HttpResponse.json(session);
  }),
  http.get(`${API_URL}/posts/:postId`, ({ params }) => {
    const post = posts.find((p) => p.id === param(params["postId"]));
    if (!post) {
      return HttpResponse.json({ message: "Post not found" }, { status: 404 });
    }
    return HttpResponse.json(post);
  }),
  http.get(`${API_URL}/posts`, () => {
    return HttpResponse.json({
      posts: posts.map(({ replies: _replies, anonymous: _anonymous, ...post }) => post),
      nextCursor: null,
    });
  }),
  http.get(`${API_URL}/admin/users`, () => {
    return HttpResponse.json(adminUsers);
  }),
];
