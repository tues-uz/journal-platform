import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Users, Shield } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useJournalStore } from "@/lib/store/store";
import { ASSIGNABLE_ROLES, ROLE_LABELS, type Role } from "@/lib/rbac/types";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

const UsersPage = () => {
  const { user, refreshUser } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const users = useJournalStore((s) => s.users);
  const createUser = useJournalStore((s) => s.createUser);
  const updateUserRoles = useJournalStore((s) => s.updateUserRoles);
  const updateUserStatus = useJournalStore((s) => s.updateUserStatus);

  const [createOpen, setCreateOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [selectedRole, setSelectedRole] = useState<Role | "">("");

  const canCreate = can("user_management", "create");
  const canEdit = can("user_management", "edit");
  const canAssign = can("user_management", "assign");

  if (!can("user_management", "view")) {
    return <Navigate to={routes.dashboard} replace />;
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleCreate = () => {
    if (!form.name || !form.email || !form.password || !selectedRole) {
      toast({ title: "Please fill all fields and select a role.", variant: "destructive" });
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      toast({ title: "Email already exists.", variant: "destructive" });
      return;
    }
    createUser({ ...form, roles: [selectedRole], status: "active" });
    toast({ title: "User created successfully." });
    setCreateOpen(false);
    setForm({ name: "", email: "", password: "" });
    setSelectedRole("");
  };

  const handleSaveRoles = () => {
    if (!selectedUserId || !user || !selectedRole) return;
    const target = users.find((u) => u.id === selectedUserId);
    const roles: Role[] = target?.roles.includes("author")
      ? ["author", selectedRole]
      : [selectedRole];
    const success = updateUserRoles(selectedUserId, roles, user.id);
    if (!success) {
      toast({
        title: "Cannot remove admin role",
        description: "You are the only active admin. Assign another admin first.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Roles updated successfully." });
    refreshUser();
    setRoleOpen(false);
  };

  const openRoleDialog = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setSelectedUserId(userId);
      const staffRole = target.roles.find((role) => role !== "author");
      setSelectedRole(staffRole ?? "");
      setRoleOpen(true);
    }
  };

  return (
    <AuthenticatedLayout
      title="User Management"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Users" }]}
      toolbar={
        canCreate ? (
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        ) : undefined
      }
    >
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Create your first user to get started."
          actionLabel={canCreate ? "Create User" : undefined}
          onAction={canCreate ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                {canAssign && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="rounded-lg text-xs">
                          {ROLE_LABELS[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status === "active" ? "default" : "destructive"}
                      className="rounded-lg"
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                  </TableCell>
                  {canAssign && (
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => openRoleDialog(u.id)}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Roles
                      </Button>
                      {canEdit && u.id !== user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => {
                            updateUserStatus(u.id, u.status === "active" ? "inactive" : "active");
                            toast({ title: `User ${u.status === "active" ? "deactivated" : "activated"}.` });
                          }}
                        >
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
                <SelectTrigger id="create-role" className="rounded-xl mt-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="rounded-xl">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Roles — {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="assign-role">Role</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
              <SelectTrigger id="assign-role" className="rounded-xl mt-1">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUser?.roles.includes("author") && (
              <p className="text-xs text-gray-500 mt-2">
                This user is also registered as an Author (self-signup). That role is kept automatically.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveRoles} disabled={!selectedRole} className="rounded-xl">
              Save Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
};

export default UsersPage;
