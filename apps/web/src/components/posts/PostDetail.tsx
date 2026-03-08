type PostItem = {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

interface PostDetailProps {
  post: PostItem | null;
}

export function PostDetail({ post }: PostDetailProps) {
  if (!post) {
    return;
  }

  return (
    <div className="flex flex-col p-6">
      <h1 className="text-xl font-semibold">{post.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {new Date(post.createdAt).toLocaleString()}
      </p>
      <div className="mt-4 whitespace-pre-wrap text-sm">{post.content}</div>
    </div>
  );
}
