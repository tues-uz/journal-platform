interface ArticleReferencesProps {
  references: string[];
}

export function ArticleReferences({ references }: ArticleReferencesProps) {
  if (references.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">
        References
      </h2>
      <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-700 leading-relaxed">
        {references.map((reference) => (
          <li key={reference} className="pl-1">
            {reference}
          </li>
        ))}
      </ol>
    </section>
  );
}
