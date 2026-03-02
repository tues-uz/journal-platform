import { describe, expect, it } from "vitest";
import {
  getAlignmentForCommand,
  normalizeTableDimensions,
} from "@/features/editor/services/editorCommands";

describe("normalizeTableDimensions", () => {
  it("returns null when rows or cols are invalid", () => {
    expect(normalizeTableDimensions(Number.NaN, 3)).toBeNull();
    expect(normalizeTableDimensions(3, 0)).toBeNull();
    expect(normalizeTableDimensions(-1, 4)).toBeNull();
  });

  it("returns integer row and col values when valid", () => {
    expect(normalizeTableDimensions(3.7, 2.2)).toEqual({ rows: 3, cols: 2 });
  });

  it("maps justify commands to alignment values", () => {
    expect(getAlignmentForCommand("justifyLeft")).toBe("left");
    expect(getAlignmentForCommand("justifyCenter")).toBe("center");
    expect(getAlignmentForCommand("justifyRight")).toBe("right");
    expect(getAlignmentForCommand("justifyFull")).toBe("justify");
    expect(getAlignmentForCommand("bold")).toBeNull();
  });
});
