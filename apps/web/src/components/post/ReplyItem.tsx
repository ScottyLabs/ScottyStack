import type { User } from "@scottystack/access-control";
import { hasPermission } from "@scottystack/access-control";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { $api } from "@/lib/apiClient";
import { FieldError } from "@/lib/FieldError";
import { replyFormSchema } from "@/lib/formSchemas";

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

interface ReplyEditFormProps {
  reply: ReplyItemProps["reply"];
  postId: string;
  onEndEdit: () => void;
}

function ReplyEditForm({ reply, postId, onEndEdit }: ReplyEditFormProps) {
  const queryClient = useQueryClient();

  const updateReply = $api.useMutation("patch", "/posts/{postId}/replies/{replyId}", {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/posts/{postId}", {
          params: { path: { postId } },
        }).queryKey,
      });
      toast.success("Reply updated");
      onEndEdit();
    },
  });

  const form = useForm({
    defaultValues: {
      content: reply.content,
      anonymous: reply.anonymous ?? false,
    },
    validators: {
      onChange: replyFormSchema,
    },
    onSubmit: async ({ value }) => {
      updateReply.mutate({
        params: { path: { postId, replyId: reply.id } },
        body: { content: value.content, anonymous: value.anonymous },
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="rounded-lg border p-4"
    >
      <form.Field
        name="content"
        children={(field) => (
          <div className="space-y-2">
            <textarea
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <FieldError field={field} />
          </div>
        )}
      />
      <div className="mt-2 flex items-center gap-4">
        <form.Field
          name="anonymous"
          children={(field) => (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="rounded border-input"
              />
              Post anonymously
            </label>
          )}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              form.reset();
              onEndEdit();
            }}
          >
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <Button type="submit" size="sm" disabled={isSubmitting || updateReply.isPending}>
                {updateReply.isPending ? "Saving..." : "Save"}
              </Button>
            )}
          />
        </div>
      </div>
    </form>
  );
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

  const canUpdate = hasPermission(user, "replies", "update", reply);
  const canDelete = hasPermission(user, "replies", "delete", reply);

  const deleteReply = $api.useMutation("delete", "/posts/{postId}/replies/{replyId}", {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/posts/{postId}", {
          params: { path: { postId } },
        }).queryKey,
      });
      toast.success("Reply deleted");
      onEndEdit();
    },
  });

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
    return <ReplyEditForm reply={reply} postId={postId} onEndEdit={onEndEdit} />;
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm">{reply.content}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {reply.authorName} · {createdAt}
          {updatedAt !== createdAt && <> · Updated {updatedAt}</>}
        </p>
        <div className="flex shrink-0 gap-2">
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
    </div>
  );
}
