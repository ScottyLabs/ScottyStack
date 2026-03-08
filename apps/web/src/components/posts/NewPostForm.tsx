import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/api/client.ts";

export function NewPostForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createPost = $api.useMutation("post", "/posts", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/posts"] });
      navigate({ to: "/" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createPost.mutate({
      body: {
        title: title.trim(),
        content: content.trim(),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">New Post</h1>

      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="post-content" className="block text-sm font-medium">
          Content
        </label>
        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post..."
          rows={8}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/" })}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createPost.isPending}>
          {createPost.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
