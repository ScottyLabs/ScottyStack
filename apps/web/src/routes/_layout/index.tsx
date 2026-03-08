import { createFileRoute } from "@tanstack/react-router";
import { PostDetail } from "@/components/posts/PostDetail";
import { usePostLayout } from "@/contexts/PostLayoutContext";

export const Route = createFileRoute("/_layout/")({
  component: IndexComponent,
});

function IndexComponent() {
  const { selectedPost } = usePostLayout();
  return <PostDetail post={selectedPost} />;
}
