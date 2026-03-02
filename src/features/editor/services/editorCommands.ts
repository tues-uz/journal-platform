import type { Editor } from "@tiptap/react";

export function getAlignmentForCommand(command: string): "left" | "center" | "right" | "justify" | null {
  switch (command) {
    case "justifyLeft":
      return "left";
    case "justifyCenter":
      return "center";
    case "justifyRight":
      return "right";
    case "justifyFull":
      return "justify";
    default:
      return null;
  }
}

export function execEditorCommand(
  editor: Editor | null,
  command: string,
  onContentChange: (nextContent: string) => void,
  value: string | null = null
) {
  if (!editor) return;

  const chain = editor.chain().focus();
  let executed = false;

  switch (command) {
    case "bold":
      executed = chain.toggleBold().run();
      break;
    case "italic":
      executed = chain.toggleItalic().run();
      break;
    case "underline":
      executed = chain.toggleUnderline().run();
      break;
    case "insertUnorderedList":
      executed = chain.toggleBulletList().run();
      break;
    case "insertOrderedList":
      executed = chain.toggleOrderedList().run();
      break;
    case "createLink":
      if (!value) return;
      executed = chain.extendMarkRange("link").setLink({ href: value }).run();
      break;
    case "foreColor":
      if (!value) return;
      executed = chain.setColor(value).run();
      break;
    default: {
      const alignment = getAlignmentForCommand(command);
      if (!alignment) return;
      executed = chain.setTextAlign(alignment).run();
      break;
    }
  }

  if (executed) {
    onContentChange(editor.getHTML());
  }
}

export function insertHeading(
  editor: Editor | null,
  level: number,
  onContentChange: (nextContent: string) => void
) {
  if (!editor || level < 1 || level > 3) return;

  const executed = editor
    .chain()
    .focus()
    .toggleHeading({ level: level as 1 | 2 | 3 })
    .run();

  if (executed) {
    onContentChange(editor.getHTML());
  }
}

export function insertCodeBlock(editor: Editor | null, onContentChange: (nextContent: string) => void) {
  if (!editor) return;
  const executed = editor.chain().focus().toggleCodeBlock().run();
  if (executed) {
    onContentChange(editor.getHTML());
  }
}

export function insertHorizontalRule(editor: Editor | null, onContentChange: (nextContent: string) => void) {
  if (!editor) return;
  const executed = editor.chain().focus().setHorizontalRule().run();
  if (executed) {
    onContentChange(editor.getHTML());
  }
}

export function insertTable(
  editor: Editor | null,
  onContentChange: (nextContent: string) => void,
  rows: number,
  cols: number
) {
  if (!editor) return;

  const dimensions = normalizeTableDimensions(rows, cols);
  if (!dimensions) return;

  const executed = editor
    .chain()
    .focus()
    .insertTable({ rows: dimensions.rows, cols: dimensions.cols, withHeaderRow: true })
    .run();

  if (executed) {
    onContentChange(editor.getHTML());
  }
}

export function insertQuote(editor: Editor | null, onContentChange: (nextContent: string) => void) {
  if (!editor) return;
  const executed = editor.chain().focus().toggleBlockquote().run();
  if (executed) {
    onContentChange(editor.getHTML());
  }
}

export function insertImage(
  editor: Editor | null,
  onContentChange: (nextContent: string) => void,
  url: string
) {
  if (!editor || !url.trim()) return;

  const executed = editor.chain().focus().setImage({ src: url }).run();
  if (executed) {
    onContentChange(editor.getHTML());
  }
}

export function normalizeTableDimensions(rows: number, cols: number): { rows: number; cols: number } | null {
  if (!Number.isFinite(rows) || !Number.isFinite(cols) || rows <= 0 || cols <= 0) {
    return null;
  }

  return {
    rows: Math.floor(rows),
    cols: Math.floor(cols),
  };
}
