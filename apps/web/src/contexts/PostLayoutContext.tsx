import { createContext, useContext, useState } from "react";

export type PostItem = {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type PostLayoutContextValue = {
  selectedPost: PostItem | null;
  setSelectedPost: (post: PostItem | null) => void;
};

const PostLayoutContext = createContext<PostLayoutContextValue | null>(null);

export function PostLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  return (
    <PostLayoutContext.Provider value={{ selectedPost, setSelectedPost }}>
      {children}
    </PostLayoutContext.Provider>
  );
}

export function usePostLayout() {
  const ctx = useContext(PostLayoutContext);
  if (!ctx)
    throw new Error("usePostLayout must be used within PostLayoutProvider");
  return ctx;
}
