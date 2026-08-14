import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { MarkdownEditor } from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/apiClient";
import { FieldError } from "@/lib/FieldError";
import { replyFormSchema } from "@/lib/formSchemas";

interface ReplyFormProps {
  postId: string;
}

export function ReplyForm({ postId }: ReplyFormProps) {
  const queryClient = useQueryClient();

  const createReply = $api.useMutation("post", "/posts/{postId}/replies", {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/posts/{postId}", {
          params: { path: { postId } },
        }).queryKey,
      });
      toast.success("Reply posted");
    },
  });

  const form = useForm({
    defaultValues: {
      content: "",
      anonymous: false,
    },
    validators: {
      onChange: replyFormSchema,
    },
    onSubmit: async ({ value }) => {
      createReply.mutate(
        {
          params: { path: { postId } },
          body: { content: value.content, anonymous: value.anonymous },
        },
        {
          onSuccess: () => {
            form.reset();
          },
        },
      );
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="mt-8 border-t pt-6"
    >
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">Reply</h2>
      <form.Field
        name="content"
        children={(field) => (
          <div className="space-y-2">
            <MarkdownEditor
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              placeholder="Write your reply..."
              height={160}
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
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || createReply.isPending}>
              {createReply.isPending ? "Posting..." : "Reply"}
            </Button>
          )}
        />
      </div>
    </form>
  );
}
