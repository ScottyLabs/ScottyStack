import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth/client.ts";
import { SignInButton } from "./SignInButton";
import { SignOutButton } from "./SignOutButton";

export function UserProfile() {
  const { data: auth } = useSession();
  const user = auth?.user;

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
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

  if (!user) {
    return <SignInButton />;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((open) => !open)}
        className="rounded-full p-2 hover:bg-white/10 transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        <User className="size-5" aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-fit min-w-40 max-w-64 rounded-lg border border-white/20 bg-gray-800 py-2 shadow-xl">
          <div className="px-4 py-3">
            <p className="font-medium text-white truncate">{user.name}</p>
            <p className="text-sm text-gray-300 truncate mt-0.5">
              {user.email}
            </p>
            <SignOutButton onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
