import { createFileRoute } from "@tanstack/react-router";
import { PostDetail } from "@/components/posts/PostDetail";
import { $api } from "@/lib/api/client";

export const Route = createFileRoute("/$postId")({
  component: PostPage,
});

function PostPage() {
  const { postId } = Route.useParams();
  const {
    data: post,
    isLoading,
    isError,
    error,
  } = $api.useQuery("get", "/posts/{postId}", { params: { path: { postId } } });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-destructive">
        Error: {String(error) ?? "Failed to load post"}
      </div>
    );
  }

  if (!post) {
    return <div className="p-6 text-muted-foreground">Post not found</div>;
  }

  return <PostDetail post={post} />;
}
