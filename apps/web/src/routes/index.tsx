import { createFileRoute } from "@tanstack/react-router";
import { AuthHello } from "@/components/AuthHello.tsx";
import { Hello } from "@/components/Hello.tsx";
import { NavBar } from "@/components/NavBar";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  <>
    <NavBar />
    <Hello />
    <AuthHello />
  </>;
}
