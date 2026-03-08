import { createFileRoute } from "@tanstack/react-router";
import { PostDetail } from "@/components/posts/PostDetail";
import { $api } from "@/lib/api/client.ts";

export const Route = createFileRoute("/$postId")({
  component: PostPage,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      $api.queryOptions("get", "/posts/{postId}", {
        params: { path: { postId: params.postId } },
      }),
    );
  },
  pendingComponent: () => (
    <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground">
      Loading...
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-6 text-destructive">
      Error: {String(error) ?? "Failed to load post"}
    </div>
  ),
});

function PostPage() {
  const { postId } = Route.useParams();
  const { data: post } = $api.useSuspenseQuery("get", "/posts/{postId}", {
    params: { path: { postId } },
  });

  if (!post) {
    return <div className="p-6 text-muted-foreground">Post not found</div>;
  }

  return <PostDetail post={post} />;
}
