import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { MarkdownEditor } from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/apiClient";
import { FieldError } from "@/lib/FieldError";
import { postFormSchema } from "@/lib/formSchemas";

interface PostEditFormProps {
  post: { id: string; title: string; content: string; anonymous?: boolean; private?: boolean };
  onCancel: () => void;
  onSuccess: () => void;
}

export function PostEditForm({ post, onCancel, onSuccess }: PostEditFormProps) {
  const queryClient = useQueryClient();

  const updatePost = $api.useMutation("patch", "/posts/{postId}", {
    onSuccess: async () => {
      const postQueryKey = $api.queryOptions("get", "/posts/{postId}", {
        params: { path: { postId: post.id } },
      }).queryKey;
      await queryClient.refetchQueries({ queryKey: postQueryKey });
      await queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/posts", {}).queryKey,
      });
      toast.success("Post updated");
      onSuccess();
    },
  });

  const form = useForm({
    defaultValues: {
      title: post.title,
      content: post.content,
      anonymous: post.anonymous ?? false,
      private: post.private ?? false,
    },
    validators: {
      onChange: postFormSchema,
    },
    onSubmit: async ({ value }) => {
      updatePost.mutate({
        params: { path: { postId: post.id } },
        body: {
          title: value.title,
          content: value.content,
          anonymous: value.anonymous,
          private: value.private,
        },
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="title"
        children={(field) => (
          <div className="space-y-2">
            <input
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xl font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <FieldError field={field} />
          </div>
        )}
      />
      <form.Field
        name="content"
        children={(field) => (
          <div className="space-y-2">
            <MarkdownEditor
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
            <FieldError field={field} />
          </div>
        )}
      />
      <div className="flex items-center gap-4">
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
        <form.Field
          name="private"
          children={(field) => (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="rounded border-input"
              />
              Post privately
            </label>
          )}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting || updatePost.isPending}>
                {updatePost.isPending ? "Saving..." : "Save"}
              </Button>
            )}
          />
        </div>
      </div>
    </form>
  );
}
