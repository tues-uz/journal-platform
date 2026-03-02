import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import JournalEditor from "@/pages/JournalEditor";
import * as editorCommands from "@/features/editor/services/editorCommands";

const toastMock = vi.fn();

function chainMock() {
  return {
    focus: () => chainMock(),
    toggleBold: () => chainMock(),
    toggleItalic: () => chainMock(),
    toggleUnderline: () => chainMock(),
    toggleBulletList: () => chainMock(),
    toggleOrderedList: () => chainMock(),
    extendMarkRange: () => chainMock(),
    setLink: () => chainMock(),
    setColor: () => chainMock(),
    setTextAlign: () => chainMock(),
    toggleHeading: () => chainMock(),
    toggleCodeBlock: () => chainMock(),
    setHorizontalRule: () => chainMock(),
    insertTable: () => chainMock(),
    toggleBlockquote: () => chainMock(),
    setImage: () => chainMock(),
    insertContent: () => chainMock(),
    run: () => true,
  };
}

vi.mock("@/components/JournalDashboardSidebar", () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/features/layout/useSidebarLayout", () => ({
  useSidebarLayout: () => ({ isCollapsed: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@tiptap/react", () => ({
  EditorContent: () => <div data-testid="editor-content" />,
  useEditor: () => ({
    chain: () => chainMock(),
    getHTML: () => "<p>content</p>",
    commands: {
      setContent: vi.fn(),
    },
  }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("JournalEditor toolbar wiring", () => {
  it("calls execEditorCommand when Bold is clicked", async () => {
    const spy = vi.spyOn(editorCommands, "execEditorCommand");
    spy.mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <JournalEditor />
      </MemoryRouter>
    );

    await user.click(screen.getByTitle("Bold"));

    expect(spy).toHaveBeenCalledWith(expect.anything(), "bold", expect.any(Function), null);
  });

  it("calls insertTable command when Insert Table is clicked", async () => {
    const promptSpy = vi.spyOn(window, "prompt");
    promptSpy.mockReturnValueOnce("2").mockReturnValueOnce("3");

    const spy = vi.spyOn(editorCommands, "insertTable");
    spy.mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <JournalEditor />
      </MemoryRouter>
    );

    await user.click(screen.getByTitle("Insert Table"));

    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.any(Function), 2, 3);
  });

  it("publishes existing article and navigates to dashboard route", async () => {
    render(
      <MemoryRouter
        initialEntries={["/dashboard/editor/1"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/dashboard/editor/:id" element={<JournalEditor />} />
          <Route path="/dashboard" element={<div data-testid="dashboard-page" />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByDisplayValue("Sample Article Title");
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    expect(toastMock).toHaveBeenCalled();
    expect(screen.getByTestId("dashboard-page")).toBeTruthy();
  });
});
