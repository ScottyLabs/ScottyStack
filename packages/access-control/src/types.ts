export type Post = {
  userId: string;
};

export type Reply = {
  userId: string;
};

export type Role = "admin" | "user";
export type User = { id: string; roles: Role[] };
