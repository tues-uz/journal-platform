import type { LucideIcon } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/app/routes";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  moduleLabel: string;
}

export function ModulePlaceholder({ title, description, icon: Icon, moduleLabel }: ModulePlaceholderProps) {
  return (
    <AuthenticatedLayout
      title={title}
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: title }]}
    >
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Icon className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">{description}</p>
          <p className="text-xs text-gray-400 mt-4">{moduleLabel} module — workflow UI coming in next phase.</p>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
