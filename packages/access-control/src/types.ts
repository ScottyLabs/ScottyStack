export type Post = {
  userId: string;
};

export type Reply = {
  userId: string;
};

// Note that
// - An admin is also a user.
// - An admin is not a guest.
// - A user is not a guest.
export type Role = "admin" | "user" | "guest";
export type User = { id: string; roles: Role[] };
