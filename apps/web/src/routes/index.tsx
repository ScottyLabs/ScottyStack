import { createFileRoute } from "@tanstack/react-router";
import { AuthHello } from "@/components/AuthHello.tsx";
import { Hello } from "@/components/Hello.tsx";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <>
      <Hello />
      <AuthHello />
    </>
  );
}
