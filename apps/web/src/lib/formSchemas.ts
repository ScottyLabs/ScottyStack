import { z } from "zod";

export const postFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
  anonymous: z.boolean(),
  private: z.boolean(),
});

export const replyFormSchema = z.object({
  content: z.string().trim().min(1, "Reply is required"),
  anonymous: z.boolean(),
});

export type PostFormValues = z.infer<typeof postFormSchema>;
export type ReplyFormValues = z.infer<typeof replyFormSchema>;
