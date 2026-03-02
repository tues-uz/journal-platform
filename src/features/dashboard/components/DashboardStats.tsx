import type { LucideIcon } from "lucide-react";

interface DashboardStat {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export function DashboardStats({
  userRole,
  stats,
}: {
  userRole: "journal_maker" | "journal_kurator";
  stats: DashboardStat[];
}) {
  if (userRole === "journal_kurator") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-4">
                <div className={`${stat.bgColor} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 transition-all duration-200 overflow-hidden group"
          >
            <div
              className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity`}
            />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-2.5 rounded-xl shadow-sm`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
