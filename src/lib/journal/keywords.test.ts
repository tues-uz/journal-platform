import { describe, expect, it } from "vitest";
import {
  applyKeywordSuggestion,
  commitKeywordFragment,
  filterKeywordSuggestions,
  parseKeywordInput,
  removeKeywordAt,
  serializeKeywordInput,
} from "@/lib/journal/keywords";

describe("keyword suggestions", () => {
  const vocabulary = ["corporate governance", "climate change", "machine learning"];

  it("parses the fragment after the last comma", () => {
    expect(parseKeywordInput("ecology, corp")).toEqual({
      completed: ["ecology"],
      fragment: "corp",
    });
  });

  it("filters vocabulary by fragment and excludes selected keywords", () => {
    expect(filterKeywordSuggestions(vocabulary, "corp")).toEqual(["corporate governance"]);
    expect(filterKeywordSuggestions(vocabulary, "ecology, corp")).toEqual([
      "corporate governance",
    ]);
  });

  it("appends a suggestion as a comma-separated keyword", () => {
    expect(applyKeywordSuggestion("corp", "corporate governance")).toBe(
      "corporate governance, ",
    );
    expect(applyKeywordSuggestion("ecology, corp", "corporate governance")).toBe(
      "ecology, corporate governance, ",
    );
  });

  it("serializes chips and removes keywords by index", () => {
    expect(serializeKeywordInput(["ecology", "climate"], "bio")).toBe("ecology, climate, bio");
    expect(removeKeywordAt("ecology, climate, bio", 0)).toBe("climate, bio");
    expect(commitKeywordFragment("ecology, corp")).toBe("ecology, corp, ");
  });
});
