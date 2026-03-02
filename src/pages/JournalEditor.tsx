import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import LinkExtension from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TableExtension from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Link,
  Image,
  Save,
  Eye,
  X,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  Palette,
  Code,
  Minus as MinusIcon,
  Table,
  FileText,
  AlignJustify,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JournalDashboardSidebar from "@/components/JournalDashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/app/routes";
import { useSidebarLayout } from "@/features/layout/useSidebarLayout";
import { useEditorState } from "@/features/editor/hooks/useEditorState";
import {
  execEditorCommand,
  insertCodeBlock as insertCodeBlockCommand,
  insertHeading as insertHeadingCommand,
  insertHorizontalRule as insertHorizontalRuleCommand,
  insertImage as insertImageCommand,
  insertQuote as insertQuoteCommand,
  insertTable as insertTableCommand,
} from "@/features/editor/services/editorCommands";

const JournalEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCollapsed: isSidebarCollapsed } = useSidebarLayout();

  const {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    category,
    setCategory,
    tags,
    setTags,
    content,
    setContent,
    isSaving,
    setIsSaving,
    fontSize,
    lineHeight,
    showColorPicker,
    setShowColorPicker,
    textColor,
    setTextColor,
    categories,
    adjustFontSize,
  } = useEditorState();

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TextStyle,
      Color,
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      ImageExtension,
      Placeholder.configure({ placeholder: "Start writing your article here..." }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "<p></p>",
    onUpdate({ editor: currentEditor }) {
      setContent(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[600px] outline-none prose prose-lg max-w-none",
      },
    },
  });

  // Load existing article if editing
  useEffect(() => {
    if (id && id !== "new") {
      // In a real app, fetch article data here
      setTitle("Sample Article Title");
      setSubtitle("A compelling subtitle that draws readers in");
      setCategory("Macroeconomics");
      setTags("economics, policy, research");
      const seededContent = "<p>Start writing your article here...</p>";
      setContent(seededContent);
      editor?.commands.setContent(seededContent, false);
      return;
    }
    editor?.commands.setContent("<p></p>", false);
    setContent("");
  }, [id, editor, setTitle, setSubtitle, setCategory, setTags, setContent]);

  const execCommand = (command: string, value: string | null = null) => {
    execEditorCommand(editor, command, setContent, value);
  };

  const insertHeading = (level: number) => {
    insertHeadingCommand(editor, level, setContent);
  };

  const insertCodeBlock = () => {
    insertCodeBlockCommand(editor, setContent);
  };

  const insertHorizontalRule = () => {
    insertHorizontalRuleCommand(editor, setContent);
  };

  const insertTable = () => {
    const rows = prompt("Number of rows:", "3");
    const cols = prompt("Number of columns:", "3");
    if (!rows || !cols) return;

    const parsedRows = Number.parseInt(rows, 10);
    const parsedCols = Number.parseInt(cols, 10);
    insertTableCommand(editor, setContent, parsedRows, parsedCols);
  };

  const insertCallout = (type: string = "info") => {
    if (!editor) return;

    const bgColors: Record<string, string> = {
      info: "bg-blue-50 border-blue-200",
      warning: "bg-yellow-50 border-yellow-200",
      success: "bg-green-50 border-green-200",
      error: "bg-red-50 border-red-200",
    };

    const className = bgColors[type] || bgColors.info;
    const contentBlock = `<div class="p-4 rounded-lg border-l-4 my-4 ${className}">Callout text</div>`;
    const executed = editor.chain().focus().insertContent(contentBlock).run();
    if (executed) {
      setContent(editor.getHTML());
    }
  };

  const insertQuote = () => {
    insertQuoteCommand(editor, setContent);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) insertImageCommand(editor, setContent, url);
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your article",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim() || content === "<p><br></p>") {
      toast({
        title: "Content required",
        description: "Please add some content to your article",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: publish ? "Article published!" : "Article saved",
        description: publish
          ? "Your article has been submitted for review"
          : "Your draft has been saved",
      });
      
      if (publish) {
        navigate(routes.dashboard);
      }
    }, 1000);
  };

  const changeTextColor = (color: string) => {
    setTextColor(color);
    execCommand("foreColor", color);
    setShowColorPicker(false);
  };

  const presetColors = [
    "#000000", // Black
    "#333333", // Dark Gray
    "#666666", // Gray
    "#999999", // Light Gray
    "#FF0000", // Red
    "#FF6B00", // Orange
    "#FFD700", // Gold
    "#32CD32", // Lime Green
    "#008000", // Green
    "#00CED1", // Dark Turquoise
    "#0000FF", // Blue
    "#4B0082", // Indigo
    "#8B00FF", // Violet
    "#FF1493", // Deep Pink
    "#800080", // Purple
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <JournalDashboardSidebar />
      
      <main className={`pb-20 transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-56"}`} onClick={() => setShowColorPicker(false)}>
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Formatting Tools - 1 Row */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("bold")}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("italic")}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("underline")}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Underline"
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-1 flex-shrink-0" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          title="Headings"
                        >
                          <Heading1 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => insertHeading(1)}>
                          <Heading1 className="h-4 w-4 mr-2" />
                          Heading 1
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertHeading(2)}>
                          <Heading2 className="h-4 w-4 mr-2" />
                          Heading 2
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertHeading(3)}>
                          <Heading3 className="h-4 w-4 mr-2" />
                          Heading 3
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertQuote()}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insertCodeBlock}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Code Block"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-1 flex-shrink-0" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          title="Lists"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => execCommand("insertUnorderedList")}>
                          <List className="h-4 w-4 mr-2" />
                          Bullet List
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => execCommand("insertOrderedList")}>
                          <ListOrdered className="h-4 w-4 mr-2" />
                          Numbered List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="w-px h-4 bg-gray-300 mx-1 flex-shrink-0" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insertLink}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Insert Link"
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insertImage}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Insert Image"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insertTable}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Insert Table"
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insertHorizontalRule}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Horizontal Rule"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-1 flex-shrink-0" />
                    <div className="relative flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="h-8 w-8 p-0 flex-shrink-0"
                        title="Text Color"
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                      {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50" style={{ width: '200px' }}>
                          <div className="mb-2">
                            <Label className="text-xs text-gray-600 mb-1 block">Preset Colors</Label>
                            <div className="grid grid-cols-5 gap-2">
                              {presetColors.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => changeTextColor(color)}
                                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <Label className="text-xs text-gray-600 mb-1 block">Custom Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={textColor}
                                onChange={(e) => changeTextColor(e.target.value)}
                                className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-px h-4 bg-gray-300 mx-1 flex-shrink-0" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          title="Text Alignment"
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => execCommand("justifyLeft")}>
                          <AlignLeft className="h-4 w-4 mr-2" />
                          Align Left
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => execCommand("justifyCenter")}>
                          <AlignCenter className="h-4 w-4 mr-2" />
                          Align Center
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => execCommand("justifyRight")}>
                          <AlignRight className="h-4 w-4 mr-2" />
                          Align Right
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => execCommand("justifyFull")}>
                          <AlignJustify className="h-4 w-4 mr-2" />
                          Justify
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="w-px h-4 bg-gray-300 mx-1 flex-shrink-0" />
                    <div className="flex items-center gap-1 border border-gray-300 rounded px-2 h-8 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustFontSize(false)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                        title="Decrease font size"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-gray-600 min-w-[30px] text-center flex-shrink-0">{fontSize}px</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustFontSize(true)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                        title="Increase font size"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                </div>
              </div>

              {/* Right: Actions - Fixed */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  title={isSaving ? "Saving..." : "Save Draft"}
                  className="h-9 w-9 flex-shrink-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(routes.dashboard)}
                  title="Preview"
                  className="h-9 w-9 flex-shrink-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <div className="relative flex-shrink-0 hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const type = prompt("Callout type (info/warning/success/error):", "info");
                      if (type) insertCallout(type);
                    }}
                    title="Insert Callout"
                    className="h-9 px-3"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Callout
                  </Button>
                </div>
                <Button
                  className="bg-gray-900 text-white hover:bg-gray-800 flex-shrink-0"
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                >
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="container mx-auto px-6 max-w-4xl pt-6">
          {/* Metadata Section */}
          <div className="py-8 space-y-6">
            <div>
              <Input
                type="text"
                placeholder="Journal Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-4xl font-bold border-0 focus-visible:ring-0 p-0 h-auto placeholder:text-gray-400"
                style={{ fontSize: "42px", lineHeight: "1.25" }}
              />
            </div>

            <div>
              <Input
                type="text"
                placeholder="Subtitle (optional)"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="text-xl border-0 focus-visible:ring-0 p-0 h-auto placeholder:text-gray-400"
                style={{ fontSize: "22px", lineHeight: "1.4" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700 mb-2 block">
                  Tags (comma separated)
                </Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="economics, policy, research"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="py-8">
            <div
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Layout Elements Guide */}
          <div className="mt-12 space-y-6 hidden">
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Layout Elements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Text Formatting</h4>
                  <ul className="space-y-1">
                    <li>• <strong>Bold</strong>, <em>Italic</em>, <u>Underline</u></li>
                    <li>• Headings (H1, H2, H3)</li>
                    <li>• Text alignment (Left, Center, Right, Justify)</li>
                    <li>• Font size adjustment</li>
                    <li>• Text color picker</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Content Blocks</h4>
                  <ul className="space-y-1">
                    <li>• Quote blocks</li>
                    <li>• Code blocks</li>
                    <li>• Bullet and numbered lists</li>
                    <li>• Tables</li>
                    <li>• Horizontal rules (dividers)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Media & Links</h4>
                  <ul className="space-y-1">
                    <li>• Insert images</li>
                    <li>• Add hyperlinks</li>
                    <li>• Image captions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Special Elements</h4>
                  <ul className="space-y-1">
                    <li>• Callout boxes (info, warning, success, error)</li>
                    <li>• Custom styling</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Writing Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Use clear, concise language</li>
                <li>• Break up long paragraphs for better readability</li>
                <li>• Add images to illustrate your points</li>
                <li>• Use headings to structure your content</li>
                <li>• Cite your sources when referencing research</li>
                <li>• Review your article before publishing</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JournalEditor;
