import { createFileRoute } from "@tanstack/react-router";
import { toast } from "react-toastify";
import { AuthHello } from "@/components/AuthHello.tsx";
import { Hello } from "@/components/Hello.tsx";
import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "@/lib/auth/client.ts";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data: auth } = useSession();

  if (!auth?.user) {
    return (
      <div className="m-2">
        Unauthenticated. <Button onClick={() => signIn()}>Sign In</Button>
      </div>
    );
  }

  return (
    <>
      <Hello />
      <AuthHello />
      <div>Groups: {auth?.user.groups?.join(", ")}</div>
      <Button onClick={signOut}>Sign Out</Button>
      <Button
        variant="secondary"
        onClick={() => {
          toast.success("This is a success toast");
        }}
      >
        Success Toast
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          toast.error(
            "This is an error toast dsff sdfds fds f sdf sdf sd sdfsfiudfsifefbiswbfehbewjh sdfsdfsdfsfsdfssd",
          );
        }}
      >
        Error Toast
      </Button>
    </>
  );
}
