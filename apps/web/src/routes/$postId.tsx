import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PostEditForm } from "@/components/post/PostEditForm";
import { PostHeader } from "@/components/post/PostHeader";
import { ReplyForm } from "@/components/post/ReplyForm";
import { ReplyList } from "@/components/post/ReplyList";
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
  const { data: auth } = useSession();
  const { data: post } = $api.useSuspenseQuery("get", "/posts/{postId}", {
    params: { path: { postId } },
  });

  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col p-6">
      {editing ? (
        <PostEditForm
          post={post}
          onCancel={() => setEditing(false)}
          onSuccess={() => setEditing(false)}
        />
      ) : (
        <>
          <PostHeader post={post} onEdit={() => setEditing(true)} />
          <div className="mt-4 whitespace-pre-wrap text-sm">{post.content}</div>
        </>
      )}

      {post.replies && post.replies.length > 0 && (
        <ReplyList replies={post.replies} postId={postId} />
      )}

      {auth?.user && <ReplyForm postId={postId} />}
    </div>
  );
}
