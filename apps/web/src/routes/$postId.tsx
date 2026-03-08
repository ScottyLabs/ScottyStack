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
    <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
      Loading...
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">
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
        {post.authorName} ·{" "}
        {new Date(post.updatedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
      <div className="mt-4 whitespace-pre-wrap text-sm">{post.content}</div>

      {post.replies && post.replies.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Replies ({post.replies.length})
          </h2>
          <ul className="space-y-4">
            {post.replies.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border bg-muted/30 p-4 text-sm"
              >
                <p className="mb-1 text-sm text-muted-foreground">
                  {r.authorName} ·{" "}
                  {new Date(r.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <div className="whitespace-pre-wrap text-sm">{r.content}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
