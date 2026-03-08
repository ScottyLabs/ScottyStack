import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth/client.ts";
import { SignInButton } from "./SignInButton";
import { SignOutButton } from "./SignOutButton";

export function UserProfile() {
  const { data: auth } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const userName =
    auth?.user?.name ??
    (auth?.user as { givenName?: string })?.givenName ??
    "User";
  const userEmail = auth?.user?.email ?? "";

  if (!auth?.user) {
    return (
      <SignInButton className="border-white/30 bg-white text-gray-800 hover:bg-gray-100" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full p-2 hover:bg-white/10 transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        <User className="size-5" aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-fit min-w-40 max-w-64 rounded-lg border border-white/20 bg-gray-800 py-2 shadow-xl">
          <div className="px-4 py-3">
            <p className="font-medium text-white truncate">{userName}</p>
            {userEmail && (
              <p className="text-sm text-gray-300 truncate mt-0.5">
                {userEmail}
              </p>
            )}
            <SignOutButton
              onSuccess={() => setOpen(false)}
              className="mt-3 border-white/30 bg-white text-gray-800 hover:bg-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
