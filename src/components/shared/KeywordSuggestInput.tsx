import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyKeywordSuggestion,
  commitKeywordFragment,
  filterKeywordSuggestions,
  parseKeywordInput,
  removeKeywordAt,
  serializeKeywordInput,
} from "@/lib/journal/keywords";

interface KeywordSuggestInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export function KeywordSuggestInput({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: KeywordSuggestInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { completed, fragment } = parseKeywordInput(value);

  const filtered = useMemo(
    () => filterKeywordSuggestions(suggestions, value),
    [suggestions, value],
  );

  const showSuggestions = open && fragment.length > 0 && filtered.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [value, filtered.length]);

  useEffect(() => {
    if (!showSuggestions || !listRef.current) return;
    const active = listRef.current.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showSuggestions]);

  const selectSuggestion = (suggestion: string) => {
    onChange(applyKeywordSuggestion(value, suggestion));
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeKeyword = (index: number) => {
    onChange(removeKeywordAt(value, index));
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {completed.map((keyword, index) => (
          <span
            key={`${keyword}-${index}`}
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/70 bg-muted/50 py-0.5 pl-2 pr-1 text-sm text-foreground"
          >
            <span className="truncate">{keyword}</span>
            <button
              type="button"
              className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Remove ${keyword}`}
              onClick={(event) => {
                event.stopPropagation();
                removeKeyword(index);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          value={fragment}
          onChange={(event) => {
            onChange(serializeKeywordInput(completed, event.target.value));
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !fragment && completed.length > 0) {
              event.preventDefault();
              removeKeyword(completed.length - 1);
              return;
            }

            if ((event.key === "," || event.key === "Enter") && fragment.trim()) {
              if (event.key === "Enter" && showSuggestions) {
                event.preventDefault();
                const suggestion = filtered[activeIndex];
                if (suggestion) selectSuggestion(suggestion);
                return;
              }

              event.preventDefault();
              onChange(commitKeywordFragment(value));
              setOpen(false);
              return;
            }

            if (!showSuggestions) return;

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const suggestion = filtered[activeIndex];
              if (suggestion) selectSuggestion(suggestion);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={completed.length === 0 ? placeholder : "Add another keyword"}
          className="min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={id ? `${id}-suggestions` : undefined}
          aria-autocomplete="list"
        />
      </div>

      {showSuggestions ? (
        <ul
          ref={listRef}
          id={id ? `${id}-suggestions` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border/80 bg-card py-1 shadow-sm"
        >
          {filtered.map((keyword, index) => (
            <li key={keyword} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full px-3 py-2 text-left text-sm text-foreground",
                  index === activeIndex ? "bg-muted/60" : "hover:bg-muted/40",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(keyword)}
              >
                {keyword}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
