import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Select a post to view
    </div>
  );
}
