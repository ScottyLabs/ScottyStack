import { createFileRoute } from "@tanstack/react-router";

import { NewPostForm } from "@/components/posts/NewPostForm";

export const Route = createFileRoute("/new")({
  component: () => (
    <div className="p-6">
      <NewPostForm />
    </div>
  ),
});
