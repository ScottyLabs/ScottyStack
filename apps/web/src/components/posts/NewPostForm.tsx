import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { MarkdownEditor } from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/apiClient";
import { FieldError } from "@/lib/FieldError";
import { postFormSchema } from "@/lib/formSchemas";

export function NewPostForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createPost = $api.useMutation("post", "/posts", {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["get", "/posts"] });
      toast.success("Post created");
      void navigate({ to: "/" });
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      anonymous: false,
    },
    validators: {
      onChange: postFormSchema,
    },
    onSubmit: async ({ value }) => {
      createPost.mutate({
        body: {
          title: value.title,
          content: value.content,
          anonymous: value.anonymous,
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
      className="mx-auto max-w-2xl space-y-6"
    >
      <h1 className="text-xl font-semibold">New Post</h1>

      <form.Field
        name="title"
        children={(field) => (
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Title"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <form.Field
        name="content"
        children={(field) => (
          <div className="space-y-2">
            <label htmlFor="post-content" className="block text-sm font-medium">
              Content
            </label>
            <MarkdownEditor
              id="post-content"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              placeholder="Write your post..."
            />
            <FieldError field={field} />
          </div>
        )}
      />

      <div className="flex items-center justify-between">
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
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/" })}>
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting || createPost.isPending}>
                {createPost.isPending ? "Posting..." : "Post"}
              </Button>
            )}
          />
        </div>
      </div>
    </form>
  );
}
