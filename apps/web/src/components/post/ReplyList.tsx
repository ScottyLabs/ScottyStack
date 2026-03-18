import { useState } from "react";

import { useUser } from "@/hooks/useUser";

import { ReplyItem } from "./ReplyItem";

interface Reply {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  anonymous?: boolean;
  userId: string;
}

interface ReplyListProps {
  replies: Reply[];
  postId: string;
}

export function ReplyList({ replies, postId }: ReplyListProps) {
  const user = useUser();
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">Replies ({replies.length})</h2>
      <div className="space-y-4">
        {replies.map((reply) => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            user={user}
            postId={postId}
            isEditing={editingReplyId === reply.id}
            onStartEdit={() => setEditingReplyId(reply.id)}
            onEndEdit={() => setEditingReplyId(null)}
          />
        ))}
      </div>
    </div>
  );
}
