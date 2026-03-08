import type { User } from "@scottystack/access-control";
import { hasPermission } from "@scottystack/access-control";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/apiClient";

interface ReplyItemProps {
  reply: {
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
    anonymous?: boolean;
    userId: string;
  };
  user: User;
  postId: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}

export function ReplyItem({
  reply,
  user,
  postId,
  isEditing,
  onStartEdit,
  onEndEdit,
}: ReplyItemProps) {
  const queryClient = useQueryClient();
  const [editContent, setEditContent] = useState(reply.content);
  const [editAnonymous, setEditAnonymous] = useState(reply.anonymous ?? false);

  const canUpdate = hasPermission(user, "replies", "update", reply);
  const canDelete = hasPermission(user, "replies", "delete", reply);

  const updateReply = $api.useMutation(
    "patch",
    "/posts/{postId}/replies/{replyId}",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: $api.queryOptions("get", "/posts/{postId}", {
            params: { path: { postId } },
          }).queryKey,
        });
        onEndEdit();
      },
    },
  );

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
        onEndEdit();
      },
    },
  );

  const handleSave = () => {
    if (!editContent.trim()) return;
    updateReply.mutate({
      params: { path: { postId, replyId: reply.id } },
      body: { content: editContent.trim(), anonymous: editAnonymous },
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this reply?")) {
      deleteReply.mutate({ params: { path: { postId, replyId: reply.id } } });
    }
  };

  const createdAt = new Date(reply.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const updatedAt = new Date(reply.updatedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (isEditing) {
    return (
      <div className="rounded-lg border p-4">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex items-center gap-4">
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
              size="sm"
              onClick={() => {
                setEditContent(reply.content);
                setEditAnonymous(reply.anonymous ?? false);
                onEndEdit();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateReply.isPending}
            >
              {updateReply.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm">{reply.content}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {reply.authorName} · {createdAt}
        {updatedAt !== createdAt && <> · Updated {updatedAt}</>}
      </p>
      <div className="mt-2 flex gap-2">
        {canUpdate && (
          <Button type="button" variant="ghost" size="sm" onClick={onStartEdit}>
            Edit
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={deleteReply.isPending}
            onClick={handleDelete}
          >
            {deleteReply.isPending ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}
