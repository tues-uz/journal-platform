import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { ProfileAvatarEditor } from "@/components/shared/ProfileAvatarEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/useAuth";
import { useJournalStore } from "@/lib/store/store";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { routes } from "@/app/routes";

const ProfilePage = () => {
  const { user } = useAuth();
  const storeUser = useJournalStore((s) => (user ? s.getUserById(user.id) : undefined));

  return (
    <AuthenticatedLayout
      title="Profile"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Profile" }]}
    >
      <Card className="rounded-xl shadow-sm max-w-lg">
        <CardHeader>
          <CardTitle>{user?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileAvatarEditor size="lg" />

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          {storeUser?.institution && (
            <div>
              <p className="text-sm text-gray-500">Institution</p>
              <p className="font-medium">{storeUser.institution}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">
              {user?.roles.map((role) => (
                <Badge key={role} variant="secondary" className="rounded-lg">
                  {ROLE_LABELS[role]}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
};

export default ProfilePage;
