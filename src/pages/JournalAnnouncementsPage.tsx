import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { PublicBreadcrumb } from "@/components/JournalSidebar";
import { ANNOUNCEMENTS } from "@/lib/journal/staticContent";

const JournalAnnouncementsPage = () => {
  return (
    <PublicJournalLayout>
      <div>
        <PublicBreadcrumb items={[{ label: "Announcements" }]} />
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Announcements</h1>

        <div className="space-y-8">
          {ANNOUNCEMENTS.map((item) => (
            <article key={item.id} className="border-b border-gray-200 pb-8 last:border-0">
              <p className="text-sm text-gray-500 mb-2">{item.date}</p>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h2>
              <p className="text-base leading-normal text-gray-600">
                {[item.excerpt, ...item.body].join(" ")}
              </p>
            </article>
          ))}
        </div>
      </div>
    </PublicJournalLayout>
  );
};

export default JournalAnnouncementsPage;
