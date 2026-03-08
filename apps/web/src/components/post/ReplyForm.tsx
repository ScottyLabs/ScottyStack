import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/apiClient";

interface ReplyFormProps {
  postId: string;
}

export function ReplyForm({ postId }: ReplyFormProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const createReply = $api.useMutation("post", "/posts/{postId}/replies", {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/posts/{postId}", {
          params: { path: { postId } },
        }).queryKey,
      });
      toast.success("Reply posted");
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
    <form onSubmit={handleSubmit} className="mt-8 border-t pt-6">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">Reply</h2>
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
  );
}
