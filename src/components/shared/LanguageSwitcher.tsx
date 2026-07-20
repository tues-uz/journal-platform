import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  SUPPORTED_LANGUAGES,
  getLanguageOption,
  isAppLanguage,
} from "@/lib/i18n/languages";
import type { AppLanguage } from "@/lib/i18n/languages";

interface LanguageSwitcherProps {
  showLabel?: boolean;
  className?: string;
}

function LanguageOptionLabel({
  flag,
  nativeLabel,
  label,
}: {
  flag: string;
  nativeLabel: string;
  label: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none"
        aria-hidden
      >
        {flag}
      </span>
      <span className="truncate leading-none">
        {nativeLabel} ({label})
      </span>
    </span>
  );
}

export function LanguageSwitcher({ showLabel = true, className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const currentLanguage = isAppLanguage(i18n.language) ? i18n.language : "en";
  const selectedLanguage = getLanguageOption(currentLanguage);

  const handleChange = (value: string) => {
    if (isAppLanguage(value)) {
      void i18n.changeLanguage(value);
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor="language-select" className="mb-2 block">
          {t("settings.language.label")}
        </Label>
      )}
      <Select value={currentLanguage} onValueChange={handleChange}>
        <SelectTrigger
          id="language-select"
          className="rounded-xl w-full sm:w-72 h-11 [&>span]:flex [&>span]:items-center"
        >
          <LanguageOptionLabel
            flag={selectedLanguage.flag}
            nativeLabel={selectedLanguage.nativeLabel}
            label={selectedLanguage.label}
          />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <LanguageOptionLabel
                flag={language.flag}
                nativeLabel={language.nativeLabel}
                label={language.label}
              />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function getCurrentAppLanguage(language: string): AppLanguage {
  return isAppLanguage(language) ? language : "en";
}
