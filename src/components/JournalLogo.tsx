interface JournalLogoProps {
  className?: string;
  alt?: string;
}

export function JournalLogo({
  className = "h-8 w-auto",
  alt = "Studies in Economics and Finance System",
}: JournalLogoProps) {
  return (
    <img
      src="/tues-journal-logo.png"
      alt={alt}
      className={className}
      decoding="async"
    />
  );
}
