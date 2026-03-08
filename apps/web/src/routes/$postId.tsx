import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/api/client.ts";
import { useSession } from "@/lib/auth/client.ts";

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
  const queryClient = useQueryClient();
  const { data: auth } = useSession();
  const { data: post } = $api.useSuspenseQuery("get", "/posts/{postId}", {
    params: { path: { postId } },
  });

  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const createReply = $api.useMutation("post", "/posts/{postId}/replies", {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["get", "/posts/{postId}", { path: { postId } }],
      });
      setContent("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createReply.mutate({
      params: { path: { postId } },
      body: { content: content.trim(), anonymous },
    });
  };

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
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
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

      {auth?.user && (
        <form onSubmit={handleSubmit} className="mt-8 border-t pt-6">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Reply
          </h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
          <div className="mt-2 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded border-input"
              />
              Post anonymously
            </label>
            <Button type="submit" disabled={createReply.isPending}>
              {createReply.isPending ? "Posting..." : "Reply"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
