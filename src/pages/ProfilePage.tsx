import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { ProfileAvatarEditor } from "@/components/shared/ProfileAvatarEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { usersApi } from "@/lib/api/users";
import { ApiClientError } from "@/lib/api/client";
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

  const isDirty =
    name.trim() !== (user?.name ?? "") || institution.trim() !== (user?.institution ?? "");

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({ name: name.trim(), institution: institution.trim() });
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Profile" }]}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-8">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
            Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Update your photo, name, and institution.
          </p>
        </div>

        <section aria-label="Profile photo" className="rounded-lg border border-border/80 bg-card">
          <div className="border-b border-border/80 px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Photo</h2>
          </div>
          <div className="px-4 py-4">
            <ProfileAvatarEditor size="lg" showRoles />
          </div>
        </section>

        <section
          aria-label="Personal details"
          className="rounded-lg border border-border/80 bg-card"
        >
          <div className="border-b border-border/80 px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Personal details</h2>
          </div>

          <dl className="divide-y divide-border/80 px-4">
            <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:items-center sm:gap-4">
              <dt className="text-xs font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm text-foreground">{user?.email}</dd>
            </div>

            <div className="grid gap-2 py-3 sm:grid-cols-[8rem_1fr] sm:items-center sm:gap-4">
              <Label
                htmlFor="profileName"
                className="text-xs font-medium text-muted-foreground sm:pt-0"
              >
                Full name
              </Label>
              <Input
                id="profileName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 rounded-lg border-border/80 bg-background text-sm"
              />
            </div>

            <div className="grid gap-2 py-3 sm:grid-cols-[8rem_1fr] sm:items-center sm:gap-4">
              <Label
                htmlFor="profileInstitution"
                className="text-xs font-medium text-muted-foreground sm:pt-0"
              >
                Institution
              </Label>
              <Input
                id="profileInstitution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="University or research institute"
                className="h-9 rounded-lg border-border/80 bg-background text-sm"
              />
            </div>
          </dl>

          {isDirty && (
            <div className="border-t border-border/80 px-4 py-3">
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="h-9 rounded-lg px-4 text-sm"
              >
                {updateProfileMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )}
        </section>
      </div>
    </AuthenticatedLayout>
  );
};

export default ProfilePage;
