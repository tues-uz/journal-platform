import type { Role } from "@/lib/rbac/types";
import type { Submission } from "@/lib/store/types";

export interface DirectoryUser {
  name: string;
  roles: Role[];
}

/**
 * There's no general id→name directory endpoint (see SubmissionsPage). Each
 * submission DTO does embed the names of the people assigned to it, so we can
 * resolve names for exactly the ids a submission list already references by
 * indexing those embedded names — no extra request needed.
 */
export function buildUserDirectory(submissions: Submission[]): (id: string) => DirectoryUser | undefined {
  const map = new Map<string, DirectoryUser>();

  const add = (id: string | undefined, name: string | undefined, role: Role) => {
    if (id && name) map.set(id, { name, roles: [role] });
  };

  for (const s of submissions) {
    add(s.authorId, s.authorName, "author");
    add(s.handlingEditorId, s.handlingEditorName, "handling_editor");
    add(s.reviewerId, s.reviewerName, "reviewer");
    add(s.copyeditorId, s.copyeditorName, "copyeditor");
    add(s.layoutEditorId, s.layoutEditorName, "layout_editor");
  }

  return (id: string) => map.get(id);
}
