ALTER TABLE "user" ADD COLUMN "full_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_full_email_unique" UNIQUE("full_email");