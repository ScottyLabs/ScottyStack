import { hasPermission } from "@scottystack/access-control";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { $api } from "@/lib/apiClient";
import { useSession } from "@/lib/authClient";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: auth } = useSession();
  const { data: post } = $api.useSuspenseQuery("get", "/posts/{postId}", {
    params: { path: { postId } },
  });

  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [editAnonymous, setEditAnonymous] = useState(post.anonymous ?? false);

  const user = useUser();
  const canUpdate = hasPermission(user, "posts", "update", post);
  const canDelete = hasPermission(user, "posts", "delete", post);

  const updatePost = $api.useMutation("patch", "/posts/{postId}", {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["get", "/posts/{postId}", { path: { postId } }],
      });
      queryClient.invalidateQueries({ queryKey: ["get", "/posts"] });
      setEditing(false);
    },
  });

  const createReply = $api.useMutation("post", "/posts/{postId}/replies", {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/posts/{postId}", {
          params: { path: { postId } },
        }).queryKey,
      });
      setContent("");
    },
  });

  const deletePost = $api.useMutation("delete", "/posts/{postId}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/posts"] });
      navigate({ to: "/" });
    },
  });

  const deleteReply = $api.useMutation(
    "delete",
    "/posts/{postId}/replies/{replyId}",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: $api.queryOptions("get", "/posts/{postId}", {
            params: { path: { postId } },
          }).queryKey,
        });
      },
    },
  );

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createReply.mutate({
      params: { path: { postId } },
      body: { content: content.trim(), anonymous },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    updatePost.mutate({
      params: { path: { postId } },
      body: {
        title: editTitle.trim(),
        content: editContent.trim(),
        anonymous: editAnonymous,
      },
    });
  };

  return (
    <div className="flex flex-col p-6">
      {editing ? (
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xl font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editAnonymous}
                onChange={(e) => setEditAnonymous(e.target.checked)}
                className="rounded border-input"
              />
              Post anonymously
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setEditTitle(post.title);
                  setEditContent(post.content);
                  setEditAnonymous(post.anonymous ?? false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePost.isPending}>
                {updatePost.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{post.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {post.authorName} · Created{" "}
                {new Date(post.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {post.updatedAt !== post.createdAt && (
                  <>
                    {" "}
                    · Updated{" "}
                    {new Date(post.updatedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {canUpdate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditTitle(post.title);
                    setEditContent(post.content);
                    setEditAnonymous(post.anonymous ?? false);
                    setEditing(true);
                  }}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deletePost.isPending}
                  onClick={() => {
                    if (confirm("Delete this post? This cannot be undone.")) {
                      deletePost.mutate({ params: { path: { postId } } });
                    }
                  }}
                >
                  {deletePost.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 whitespace-pre-wrap text-sm">{post.content}</div>
        </>
      )}

      {post.replies && post.replies.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Replies ({post.replies.length})
          </h2>
          <ul className="space-y-4">
            {post.replies.map((r) => {
              const canDeleteThisReply = hasPermission(
                user,
                "replies",
                "delete",
                r,
              );
              return (
                <li
                  key={r.id}
                  className="rounded-lg border bg-muted/30 p-4 text-sm"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      {r.authorName} · Created{" "}
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {r.updatedAt !== r.createdAt && (
                        <>
                          {" "}
                          · Updated{" "}
                          {new Date(r.updatedAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </>
                      )}
                    </p>
                    {canDeleteThisReply && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteReply.isPending}
                        onClick={() => {
                          if (
                            confirm("Delete this reply? This cannot be undone.")
                          ) {
                            deleteReply.mutate({
                              params: { path: { postId, replyId: r.id } },
                            });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{r.content}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {auth?.user && (
        <form onSubmit={handleReplySubmit} className="mt-8 border-t pt-6">
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
