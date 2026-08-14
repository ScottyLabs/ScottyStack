import MarkdownPreview from "@uiw/react-markdown-preview/nohighlight";
import type { ComponentPropsWithoutRef } from "react";
import remarkGfm from "remark-gfm";

function isSafeHttpUrl(href: string | undefined): boolean {
  if (!href) {
    return false;
  }
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function MarkdownLink({ href, children }: ComponentPropsWithoutRef<"a">) {
  if (!isSafeHttpUrl(href)) {
    return <>{children}</>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function omitUnsupportedNode() {
  return null;
}

function safeUrlTransform(url: string): string {
  return isSafeHttpUrl(url) ? url : "";
}

export const markdownPreviewOptions = {
  remarkPlugins: [remarkGfm],
  urlTransform: safeUrlTransform,
  components: {
    a: MarkdownLink,
    img: omitUnsupportedNode,
    table: omitUnsupportedNode,
  },
};

export function markdownColorMode(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

interface MarkdownContentProps {
  source: string;
  className?: string;
}

export function MarkdownContent({ source, className }: MarkdownContentProps) {
  return (
    <MarkdownPreview
      source={source}
      className={className}
      wrapperElement={{ "data-color-mode": markdownColorMode() }}
      {...markdownPreviewOptions}
    />
  );
}
