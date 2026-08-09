import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { PublicBreadcrumb } from "@/components/JournalSidebar";
import { IssueTocList } from "@/components/journal/IssueTocList";
import { getCurrentIssue } from "@/lib/journal/issueArticles";
import { routes } from "@/app/routes";

const JournalCurrentIssuePage = () => {
  const issue = getCurrentIssue();

  return (
    <PublicJournalLayout>
      <div>
        <PublicBreadcrumb items={[{ label: "Current Issue" }]} />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{issue.label}</h1>
        {issue.doi && (
          <p className="mb-8 text-sm text-gray-600">
            DOI:{" "}
            <a
              href={issue.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {issue.doi}
            </a>
          </p>
        )}

        <IssueTocList sectionTitle={issue.sectionTitle} articles={issue.articles} />

        <p className="mt-8 text-sm text-gray-500">
          Browse past issues in the{" "}
          <a href={routes.archives} className="text-gray-900 underline hover:no-underline">
            archives
          </a>
          .
        </p>
      </div>
    </PublicJournalLayout>
  );
};

export default JournalCurrentIssuePage;
