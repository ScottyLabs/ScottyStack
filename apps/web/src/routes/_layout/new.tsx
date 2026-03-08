import { createFileRoute } from "@tanstack/react-router";
import { NewPostForm } from "@/components/posts/NewPostForm";

export const Route = createFileRoute("/_layout/new")({
  component: NewPostPage,
});

function NewPostPage() {
  return (
    <div className="p-6">
      <NewPostForm />
    </div>
  );
}
