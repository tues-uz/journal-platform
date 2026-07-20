import { describe, expect, it } from "vitest";
import { getStoredLanguage, isAppLanguage, saveLanguage } from "@/lib/i18n/languages";

describe("language storage", () => {
  it("defaults to english when nothing is stored", () => {
    localStorage.removeItem("journal-platform-language");
    expect(getStoredLanguage()).toBe("en");
  });

  it("recognizes supported language codes", () => {
    expect(isAppLanguage("en")).toBe(true);
    expect(isAppLanguage("uz")).toBe(true);
    expect(isAppLanguage("ru")).toBe(true);
    expect(isAppLanguage("zh")).toBe(true);
    expect(isAppLanguage("fr")).toBe(false);
  });

  it("persists selected language", () => {
    saveLanguage("ru");
    expect(getStoredLanguage()).toBe("ru");
    saveLanguage("en");
  });
});
