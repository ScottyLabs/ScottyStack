import MDEditor, { commands } from "@uiw/react-md-editor/nohighlight";

import { markdownColorMode, markdownPreviewOptions } from "@/components/MarkdownContent";

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  height?: number;
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  height = 240,
}: MarkdownEditorProps) {
  return (
    <div className="space-y-1">
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? "")}
        height={height}
        visibleDragbar={false}
        commands={[]}
        extraCommands={[commands.codeEdit, commands.codePreview]}
        preview="edit"
        previewOptions={markdownPreviewOptions}
        textareaProps={{
          id,
          placeholder,
          onBlur,
        }}
        data-color-mode={markdownColorMode()}
      />
      <p className="text-xs text-muted-foreground">Markdown supported</p>
    </div>
  );
}
