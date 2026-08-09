import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { PublicBreadcrumb } from "@/components/JournalSidebar";
import { EDITORIAL_TEAM } from "@/lib/journal/staticContent";

const JournalEditorialTeamPage = () => {
  return (
    <PublicJournalLayout>
      <div>
        <PublicBreadcrumb items={[{ label: "Editorial Team" }]} />
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Editorial Team</h1>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4 font-semibold text-gray-900">Name</th>
                <th className="py-3 pr-4 font-semibold text-gray-900">Role</th>
                <th className="py-3 font-semibold text-gray-900">Affiliation</th>
              </tr>
            </thead>
            <tbody>
              {EDITORIAL_TEAM.map((member) => (
                <tr key={member.name} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 pr-4 align-top">
                    <p className="font-medium text-gray-900">{member.name}</p>
                  </td>
                  <td className="py-4 pr-4 align-top text-gray-600">{member.role}</td>
                  <td className="py-4 align-top text-gray-600">{member.affiliation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PublicJournalLayout>
  );
};

export default JournalEditorialTeamPage;
