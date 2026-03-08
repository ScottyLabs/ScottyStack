import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { $api } from "@/lib/api/client.ts";
import { useSession } from "@/lib/auth/client.ts";
import { cn } from "@/lib/utils";

type PostItem = {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
};

interface PostListProps {
  selectedPostId?: string;
  onSelectPost: (post: PostItem) => void;
}

function groupPostsByDate(posts: PostItem[]) {
  const groups: Record<string, PostItem[]> = {};
  for (const post of posts) {
    const dateKey = new Date(post.updatedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(post);
  }
  return groups;
}

export function PostList({ selectedPostId, onSelectPost }: PostListProps) {
  const { data: auth } = useSession();
  const {
    data: posts,
    isLoading,
    error,
    isError,
  } = $api.useQuery("get", "/posts");

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground">
        Loading posts...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-destructive">
        Error loading posts: {String(error)}
      </div>
    );
  }

  const groupedPosts = groupPostsByDate(posts ?? []);

  return (
    <div className="flex flex-col">
      {/* New Thread Button */}
      <div className="border-b p-3">
        {auth?.user ? (
          <Link
            to="/new"
            className={cn(buttonVariants(), "w-full gap-2 bg-primary")}
          >
            <Pencil className="size-4" />
            Stack!
          </Link>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Sign in to create posts
          </p>
        )}
      </div>

      {/* Post List */}
      <div className="flex-1 overflow-y-auto">
        {(posts?.length ?? 0) === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No posts yet. Stack one!
          </div>
        ) : (
          Object.entries(groupedPosts).map(([dateKey, datePosts]) => (
            <div key={dateKey} className="border-b">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                {dateKey}
              </div>
              {datePosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onSelectPost(post)}
                  className={`flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    selectedPostId === post.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.authorName ?? "User"} ·{" "}
                        {new Date(post.updatedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
