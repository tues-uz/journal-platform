import type { Submission } from "@/lib/store/types";
import { SEED_SUBMISSIONS } from "@/lib/store/seed";

export interface ParsedKeywordInput {
  completed: string[];
  fragment: string;
}

function collectUniqueKeywords(submissions: Pick<Submission, "keywords">[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const submission of submissions) {
    for (const keyword of submission.keywords) {
      const trimmed = keyword.trim();
      if (!trimmed) continue;

      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      result.push(trimmed);
    }
  }

  return result.sort((a, b) => a.localeCompare(b));
}

/** Keywords used across the journal — seed data plus any submissions from the API. */
export function getJournalKeywordVocabulary(
  submissions: Pick<Submission, "keywords">[] = [],
): string[] {
  return collectUniqueKeywords([...SEED_SUBMISSIONS, ...submissions]);
}

export function parseKeywordInput(value: string): ParsedKeywordInput {
  if (!value.trim()) {
    return { completed: [], fragment: "" };
  }

  if (value.endsWith(",")) {
    return {
      completed: value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      fragment: "",
    };
  }

  const parts = value.split(",");
  const lastPart = parts[parts.length - 1] ?? "";

  if (parts.length === 1) {
    return { completed: [], fragment: lastPart.trim() };
  }

  return {
    completed: parts
      .slice(0, -1)
      .map((part) => part.trim())
      .filter(Boolean),
    fragment: lastPart.trim(),
  };
}

export function filterKeywordSuggestions(
  vocabulary: string[],
  value: string,
  limit = 8,
): string[] {
  const { completed, fragment } = parseKeywordInput(value);
  if (!fragment) return [];

  const query = fragment.toLowerCase();
  const selected = new Set(completed.map((keyword) => keyword.toLowerCase()));

  return vocabulary
    .filter((keyword) => !selected.has(keyword.toLowerCase()))
    .filter((keyword) => keyword.toLowerCase().includes(query))
    .slice(0, limit);
}

export function serializeKeywordInput(completed: string[], fragment: string): string {
  const trimmedFragment = fragment.trim();
  if (completed.length === 0) return trimmedFragment;
  if (!trimmedFragment) return `${completed.join(", ")}, `;
  return `${completed.join(", ")}, ${trimmedFragment}`;
}

export function removeKeywordAt(value: string, index: number): string {
  const { completed, fragment } = parseKeywordInput(value);
  const nextCompleted = completed.filter((_, itemIndex) => itemIndex !== index);
  return serializeKeywordInput(nextCompleted, fragment);
}

export function commitKeywordFragment(value: string): string {
  const { completed, fragment } = parseKeywordInput(value);
  const trimmed = fragment.trim();
  if (!trimmed) return serializeKeywordInput(completed, "");
  return serializeKeywordInput([...completed, trimmed], "");
}

export function applyKeywordSuggestion(value: string, suggestion: string): string {
  const { completed } = parseKeywordInput(value);
  return [...completed, suggestion].join(", ") + ", ";
}
