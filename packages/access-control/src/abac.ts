// This file implements a type-safe ABAC (Attribute-Based Access Control) system.
//
// References:
// - https://github.com/WebDevSimplified/permission-system/blob/main/auth-abac.ts
// - https://www.youtube.com/watch?v=5GG-VUvruzE&t=24m18s

import type { Post, Reply, Role, User } from "./types.ts";

type PermissionCheck<Key extends keyof Permissions> =
  | boolean
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean);

type RolesWithPermissions = {
  [R in Role]: Partial<{
    [Key in keyof Permissions]: Partial<{
      [Action in Permissions[Key]["action"]]: PermissionCheck<Key>;
    }>;
  }>;
};

type Permissions = {
  posts: {
    dataType: Post;
    action: "view" | "viewName" | "create" | "update" | "delete";
  };
  replies: {
    dataType: Reply;
    action: "view" | "viewName" | "create" | "update" | "delete";
  };
};

const ROLES = {
  admin: {
    posts: {
      view: true,
      viewName: true,
      create: true,
      update: false,
      delete: true,
    },
    replies: {
      view: true,
      viewName: true,
      create: true,
      update: false,
      delete: true,
    },
  },
  user: {
    posts: {
      view: true,
      viewName: false,
      create: true,
      update: (user, post) => user.id === post.userId,
      delete: false,
    },
    replies: {
      view: true,
      viewName: false,
      create: true,
      update: (user, reply) => user.id === reply.userId,
      delete: false,
    },
  },
  guest: {
    posts: {
      view: true,
    },
    replies: {
      view: true,
    },
  },
} as const satisfies RolesWithPermissions;

export function hasPermission<Resource extends keyof Permissions>(
  user: User,
  resource: Resource,
  action: Permissions[Resource]["action"],
  data?: Permissions[Resource]["dataType"],
) {
  return user.roles.some((role) => {
    const permission = (ROLES as RolesWithPermissions)[role][resource]?.[action];
    if (permission == null) return false;

    if (typeof permission === "boolean") return permission;
    return data != null && permission(user, data);
  });
}
