import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/apiClient";

interface PostEditFormProps {
  post: { id: string; title: string; content: string; anonymous?: boolean };
  onCancel: () => void;
  onSuccess: () => void;
}

export function PostEditForm({ post, onCancel, onSuccess }: PostEditFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [anonymous, setAnonymous] = useState(post.anonymous ?? false);

  const updatePost = $api.useMutation("patch", "/posts/{postId}", {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/posts/{postId}", {
          params: { path: { postId: post.id } },
        }).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: ["get", "/posts"] });
      toast.success("Post updated");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    updatePost.mutate({
      params: { path: { postId: post.id } },
      body: { title: title.trim(), content: content.trim(), anonymous },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xl font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        required
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="rounded border-input"
          />
          Post anonymously
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={updatePost.isPending}>
            {updatePost.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
