import { Navigate, useParams } from "react-router-dom";
import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { PublicBreadcrumb } from "@/components/JournalSidebar";
import { IssueTocList } from "@/components/journal/IssueTocList";
import { formatIssueSlugLabel, getIssueBySlug } from "@/lib/journal/issueArticles";
import { routes } from "@/app/routes";

const JournalArchiveIssuePage = () => {
  const { issueSlug = "" } = useParams();
  const issue = getIssueBySlug(issueSlug);
  const label = formatIssueSlugLabel(issueSlug);

  if (!issueSlug) {
    return <Navigate to={routes.archives} replace />;
  }

  if (!issue) {
    return (
      <PublicJournalLayout>
        <div>
          <PublicBreadcrumb items={[{ label: "Archives", href: routes.archives }, { label: label }]} />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{label}</h1>
          <p className="text-gray-600">This archived issue is not available yet.</p>
        </div>
      </PublicJournalLayout>
    );
  }

  return (
    <PublicJournalLayout>
      <div>
        <PublicBreadcrumb items={[{ label: "Archives", href: routes.archives }, { label: issue.label }]} />
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
      </div>
    </PublicJournalLayout>
  );
};

export default JournalArchiveIssuePage;
