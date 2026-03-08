import { createFileRoute } from "@tanstack/react-router";
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

  return (
    <div className="flex flex-col p-6">
      <h1 className="text-xl font-semibold">{post.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {post.authorName ?? "User"} ·{" "}
        {new Date(post.updatedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
      <div className="mt-4 whitespace-pre-wrap text-sm">{post.content}</div>
    </div>
  );
}
