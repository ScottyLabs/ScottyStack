import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/api/client.ts";
import { useSession } from "@/lib/auth/client.ts";

export function CreatePost() {
  const { data: auth } = useSession();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createPost = $api.useMutation("post", "/posts", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/posts"] });
      setTitle("");
      setContent("");
    },
  });

  if (!auth?.user) {
    return (
      <p className="text-muted-foreground text-sm">Sign in to create a post.</p>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createPost.mutate({
      body: { title: title.trim(), content: content.trim() },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Create Post</h2>
      <div className="space-y-2">
        <label htmlFor="post-title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
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
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </div>
      <Button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? "Creating..." : "Create Post"}
      </Button>
    </form>
  );
}
