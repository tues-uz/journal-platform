import { Link } from "react-router-dom";
import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { PublicBreadcrumb } from "@/components/JournalSidebar";
import { ARCHIVE_VOLUMES } from "@/lib/journal/staticContent";
import { routes } from "@/app/routes";

const JournalArchivesPage = () => {
  return (
    <PublicJournalLayout>
      <div>
        <PublicBreadcrumb items={[{ label: "Archives" }]} />
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Archives</h1>

        <div className="space-y-8">
          {ARCHIVE_VOLUMES.map((volume) => (
            <section key={volume.volume}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Volume {volume.volume} ({volume.year})
              </h2>
              <ul className="space-y-2">
                {volume.issues.map((issue) => (
                  <li key={issue.href}>
                    <Link
                      to={
                        issue.href === "/current"
                          ? routes.current
                          : routes.archiveIssue(issue.href.replace("/archives/", ""))
                      }
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {issue.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PublicJournalLayout>
  );
};

export default JournalArchivesPage;
