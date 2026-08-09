import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { RoleChipList } from "@/components/shared/RoleChip";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usersApi } from "@/lib/api/users";
import { ApiClientError } from "@/lib/api/client";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProfileAvatarEditorProps {
  size?: "md" | "lg";
  showRoles?: boolean;
}

export function ProfileAvatarEditor({ size = "md", showRoles = false }: ProfileAvatarEditorProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const avatarUrl = user?.avatarUrl;
  const avatarSize = size === "lg" ? "h-20 w-20" : "h-16 w-16";
  const fallbackSize = size === "lg" ? "text-2xl" : "text-xl";

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast({
        title: "Image too large",
        description: "Profile pictures must be 2 MB or smaller.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await usersApi.uploadAvatar(file);
      await refreshUser();
      toast({
        title: "Profile picture updated",
        description: "Your new photo is now visible across the app.",
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "We couldn't update your profile picture. Please try again.";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setIsUploading(true);
    try {
      await usersApi.removeAvatar();
      await refreshUser();
      toast({
        title: "Profile picture removed",
        description: "Your initials will be shown instead.",
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "We couldn't remove your profile picture. Please try again.";
      toast({
        title: "Removal failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-start gap-4">
      <div className="relative shrink-0">
        <UserAvatar
          name={user.name}
          avatarUrl={avatarUrl}
          className={avatarSize}
          fallbackClassName={fallbackSize}
        />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border border-border/80 shadow-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          onChange={handleAvatarChange}
        />
      </div>

      <div className="min-w-0 space-y-1 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          {showRoles && user.roles.length > 0 ? <RoleChipList roles={user.roles} /> : null}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, or WebP up to 2 MB.</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <button
            type="button"
            className="text-sm text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "Uploading…" : "Change photo"}
          </button>
          {avatarUrl ? (
            <>
              <span className="text-muted-foreground/40" aria-hidden>
                ·
              </span>
              <button
                type="button"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
              >
                Remove
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
