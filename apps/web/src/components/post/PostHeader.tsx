import { hasPermission } from "@scottystack/access-control";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { $api } from "@/lib/apiClient";

interface PostHeaderProps {
  post: {
    id: string;
    title: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
    content: string;
    userId: string;
  };
  onEdit: () => void;
}

export function PostHeader({ post, onEdit }: PostHeaderProps) {
  const user = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const canUpdate = hasPermission(user, "posts", "update", post);
  const canDelete = hasPermission(user, "posts", "delete", post);

  const createdAt = new Date(post.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const updatedAt = new Date(post.updatedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const deletePost = $api.useMutation("delete", "/posts/{postId}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/posts"] });
      navigate({ to: "/" });
    },
  });

  const handleDelete = () => {
    if (confirm("Delete this post? This cannot be undone.")) {
      deletePost.mutate({ params: { path: { postId: post.id } } });
    }
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {post.authorName} · Created {createdAt}
          {updatedAt !== createdAt && <> · Updated {updatedAt}</>}
        </p>
      </div>
      <div className="flex gap-2">
        {canUpdate && (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
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
            onClick={handleDelete}
          >
            {deletePost.isPending ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}
