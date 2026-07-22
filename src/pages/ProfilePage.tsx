import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { ProfileAvatarEditor } from "@/components/shared/ProfileAvatarEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { usersApi } from "@/lib/api/users";
import { ApiClientError } from "@/lib/api/client";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [institution, setInstitution] = useState(user?.institution ?? "");

  useEffect(() => {
    setName(user?.name ?? "");
    setInstitution(user?.institution ?? "");
  }, [user?.name, user?.institution]);

  const updateProfileMutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: async () => {
      await refreshUser();
      toast({ title: "Profile updated" });
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Failed to update profile.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    },
  });

  const isDirty = name.trim() !== (user?.name ?? "") || institution.trim() !== (user?.institution ?? "");

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({ name: name.trim(), institution: institution.trim() });
  };

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

          <div className="space-y-2">
            <Label htmlFor="profileName">Full name</Label>
            <Input
              id="profileName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileInstitution">Institution</Label>
            <Input
              id="profileInstitution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="University or research institute"
              className="h-11 rounded-xl"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!isDirty || updateProfileMutation.isPending}
            className="rounded-xl"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
          </Button>

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
