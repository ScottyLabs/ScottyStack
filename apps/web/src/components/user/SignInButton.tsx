import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth/client.ts";

const buttonClassName =
  "w-full border-white/30 bg-white text-gray-800 hover:bg-gray-100";

interface SignInButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function SignInButton({ onSuccess, className }: SignInButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        signIn();
        onSuccess?.();
      }}
      className={className ?? buttonClassName}
    >
      Sign In
    </Button>
  );
}
