import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client.ts";

const buttonClassName =
  "w-full border-white/30 bg-white text-gray-800 hover:bg-gray-100";

interface SignOutButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function SignOutButton({ onSuccess, className }: SignOutButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        signOut();
        onSuccess?.();
      }}
      className={className ?? buttonClassName}
    >
      Sign Out
    </Button>
  );
}
