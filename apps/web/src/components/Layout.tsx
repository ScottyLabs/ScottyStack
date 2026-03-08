import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/client.ts";
import { CreatePostForm } from "./posts/CreatePostForm";
import { PostDetail } from "./posts/PostDetail";
import { PostList } from "./posts/PostList";

type PostItem = {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
};

export function PostLayout() {
  const { data: auth } = useSession();
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-muted/30">
        <div className="p-4">
          {auth?.user ? (
            <Button
              className="w-full gap-2 bg-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Pencil className="size-4" />
              Stack!
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Sign in to create posts
            </p>
          )}
        </div>
      </aside>

      {/* Post List */}
      <section className="flex w-80 flex-col border-r">
        <PostList
          selectedPostId={selectedPost?.id}
          onSelectPost={setSelectedPost}
        />
      </section>

      {/* Right: Post Detail */}
      <main className="flex-1 overflow-auto">
        <PostDetail post={selectedPost} />
      </main>

      {/* Create Post Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setShowCreateForm(false)}
            aria-label="Close modal"
          />
          <div className="relative z-10 w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
            <CreatePostForm
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
