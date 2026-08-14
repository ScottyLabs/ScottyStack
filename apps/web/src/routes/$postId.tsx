import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MarkdownContent } from "@/components/MarkdownContent";
import { PostDetailSkeleton } from "@/components/post/PostDetailSkeleton";
import { PostEditForm } from "@/components/post/PostEditForm";
import { PostHeader } from "@/components/post/PostHeader";
import { ReplyForm } from "@/components/post/ReplyForm";
import { ReplyList } from "@/components/post/ReplyList";
import { $api } from "@/lib/apiClient";
import { useSession } from "@/lib/authClient";

export const Route = createFileRoute("/$postId")({
  component: PostPage,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      $api.queryOptions("get", "/posts/{postId}", {
        params: { path: { postId: params.postId } },
      }),
    );
  },
  pendingComponent: PostDetailSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">
      Error: {error ? String(error) : "Failed to load post"}
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
          <MarkdownContent className="mt-4 text-sm" source={post.content} />
        </>
      )}

      {post.replies && post.replies.length > 0 && (
        <ReplyList replies={post.replies} postId={postId} />
      )}

      {auth?.user && <ReplyForm postId={postId} />}
    </div>
  );
}
