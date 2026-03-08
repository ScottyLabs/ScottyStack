import type { User } from "@scottystack/access-control";
import { useSession } from "@/lib/authClient";

export function useUser(): User {
  const { data: auth } = useSession();
  if (!auth?.user)
    return {
      id: "",
      roles: ["guest"],
    };
  return {
    id: auth.user.id,
    roles: auth.user.isAdmin ? ["admin", "user"] : ["user"],
  };
}
