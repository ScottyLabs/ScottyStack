import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PostList } from "@/components/posts/PostList";
import {
  PostLayoutProvider,
  usePostLayout,
} from "@/contexts/PostLayoutContext";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <PostLayoutProvider>
      <div className="flex h-full">
        {/* Post List */}
        <section className="flex w-80 flex-col border-r">
          <PostListWithContext />
        </section>

        {/* Right: Content Area (Outlet) */}
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">
          <Outlet />
        </main>
      </div>
    </PostLayoutProvider>
  );
}

function PostListWithContext() {
  const { selectedPost, setSelectedPost } = usePostLayout();
  return (
    <PostList
      selectedPostId={selectedPost?.id}
      onSelectPost={setSelectedPost}
    />
  );
}
