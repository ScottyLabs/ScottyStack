import { Link, useParams } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import InfiniteScroll from "react-infinite-scroll-component";
import { buttonVariants } from "@/components/ui/button";
import { $api } from "@/lib/api/client.ts";
import { useSession } from "@/lib/auth/client.ts";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type PostItem = {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt?: string;
  updatedAt: string;
  authorName?: string;
};

function groupPostsByDate(posts: PostItem[]) {
  const groups: Record<string, PostItem[]> = {};
  for (const post of posts) {
    const dateKey = new Date(
      post.createdAt ?? post.updatedAt,
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(post);
  }
  return groups;
}

export function PostList() {
  const { data: auth } = useSession();
  const params = useParams({ strict: false });
  const activePostId = params?.postId;

  const {
    data,
    isLoading,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = $api.useInfiniteQuery(
    "get",
    "/posts",
    { params: { query: { limit: PAGE_SIZE } } },
    {
      pageParamName: "cursor",
      initialPageParam: "",
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
        Loading posts...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-sm text-destructive">
        Error loading posts: {String(error)}
      </div>
    );
  }

  const groupedPosts = groupPostsByDate(posts);

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

      {/* Post List with infinite scroll */}
      <div
        id="post-list-scroll"
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 120px)" }}
      >
        {posts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No posts yet. Stack one!
          </div>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={fetchNextPage}
            hasMore={hasNextPage ?? false}
            loader={
              <div className="p-4 text-center text-sm text-muted-foreground">
                {isFetchingNextPage ? "Loading more..." : null}
              </div>
            }
            scrollableTarget="post-list-scroll"
          >
            {Object.entries(groupedPosts).map(([dateKey, datePosts]) => (
              <div key={dateKey} className="border-b">
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                  {dateKey}
                </div>
                {datePosts.map((post) => {
                  const isSelected = activePostId === post.id;
                  return (
                    <Link
                      key={post.id}
                      to="/$postId"
                      params={{ postId: post.id }}
                      className={`flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                        isSelected ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {post.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {post.authorName ?? "User"} ·{" "}
                            {new Date(
                              post.createdAt ?? post.updatedAt,
                            ).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}
