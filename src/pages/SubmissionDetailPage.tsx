import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Building2, Download, Fingerprint, Globe, Mail, Tag, User, UserRoundCog, type LucideIcon } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SubmissionPaymentChip } from "@/components/shared/SubmissionPaymentChip";
import { SubmissionPositionSummary } from "@/components/shared/SubmissionPositionChip";
import { DecisionFeedbackDisplay } from "@/components/shared/DecisionFeedbackDisplay";
import { ReviewerReportsDisplay } from "@/components/shared/ReviewerReportsDisplay";
import { SubmissionWorkflowActions } from "@/components/shared/SubmissionWorkflowActions";
import { useAuth } from "@/features/auth/useAuth";
import { buildSubmissionScope, canViewSubmission } from "@/lib/rbac/submissionAccess";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { routes } from "@/app/routes";
import { getVisibleSubmissionFiles } from "@/lib/files/submissionFiles";
import { submissionsApi } from "@/lib/api/submissions";
import { activitiesApi } from "@/lib/api/activities";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { usersApi } from "@/lib/api/users";
import { getFileDownloadUrl } from "@/lib/api/files";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode } from "@/lib/demo/mode";
import { Timeline } from "@/components/shared/Timeline";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import { getHandlingEditorIds, getHandlingEditorNames } from "@/lib/workflow/handlingEditors";
import { getReviewerSlots, isReviewerOnSubmission } from "@/lib/workflow/reviewers";
import type { SubmissionAuthor } from "@/lib/store/types";

function DetailSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border/80 bg-card", className)}>
      {title ? (
        <div className="border-b border-border/80 px-5 py-3.5">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
        </div>
      ) : null}
      {children}
    </section>
  );
}

function MetadataField({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {Icon ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50">
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </div>
      ) : null}
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

function KeywordTags({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-xs font-medium text-foreground"
        >
          {keyword}
        </span>
      ))}
    </div>
  );
}

function ArticleInformationSection({
  submission,
  getUserById,
}: {
  submission: NonNullable<Awaited<ReturnType<typeof submissionsApi.get>>>;
  getUserById: (id: string) => { name: string } | undefined;
}) {
  const handlingEditorNames = getHandlingEditorNames(submission, getUserById);
  const handlingEditorDisplay =
    handlingEditorNames.length > 1
      ? handlingEditorNames.join(", ")
      : handlingEditorNames[0] ?? null;

  return (
    <DetailSection title="Article information">
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
            {submission.articleType}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
            {submission.language}
          </span>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/15 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Abstract</p>
          <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {submission.abstract}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <MetadataField
            icon={User}
            label="Author"
            value={submission.authorName ?? "—"}
          />
          <MetadataField
            icon={UserRoundCog}
            label="Handling editor"
            value={
              handlingEditorDisplay ?? (
                <span className="text-muted-foreground">Not assigned</span>
              )
            }
          />
        </div>

        <div className="border-t border-border/60 pt-5">
          <MetadataField
            icon={Tag}
            label="Keywords"
            value={<KeywordTags keywords={submission.keywords} />}
          />
        </div>
      </div>
    </DetailSection>
  );
}

function orcidProfileUrl(orcid: string): string | null {
  const compact = orcid.trim().replace(/-/g, "");
  if (!/^\d{15}[\dX]$/i.test(compact)) return null;
  const normalized = `${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}-${compact.slice(12)}`;
  return `https://orcid.org/${normalized}`;
}

function AuthorCard({ author }: { author: SubmissionAuthor }) {
  return (
    <article className="flex gap-4 rounded-lg border border-border/60 bg-muted/10 p-4">
      <UserAvatar
        name={author.name}
        className="h-10 w-10 shrink-0"
        fallbackClassName="text-sm font-medium"
      />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">{author.name}</h3>
          {author.isCorresponding ? (
            <span className="inline-flex items-center rounded-md border border-border/60 bg-background px-2 py-0.5 text-xs font-medium text-foreground">
              Corresponding author
            </span>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{author.email}</span>
          </p>
          {author.institution ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span>{author.institution}</span>
            </p>
          ) : null}
          {author.orcid ? (
            <p className="flex items-center gap-2 text-sm">
              <Fingerprint className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="shrink-0 text-xs font-medium text-muted-foreground">ORCID</span>
              <span className="text-muted-foreground/35" aria-hidden>
                ·
              </span>
              {(() => {
                const display = author.orcid.trim();
                const href = orcidProfileUrl(display);
                if (href) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-mono text-xs text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {display}
                    </a>
                  );
                }
                return (
                  <span className="truncate font-mono text-xs text-foreground/80">{display}</span>
                );
              })()}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AuthorsSection({ authors }: { authors: SubmissionAuthor[] }) {
  return (
    <DetailSection title="Authors">
      <div className="space-y-3 p-5">
        {authors.map((author, index) => (
          <AuthorCard key={`${author.email}-${index}`} author={author} />
        ))}
      </div>
    </DetailSection>
  );
}

const SubmissionDetailPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => submissionsApi.get(id as string),
    enabled: !!id && !!user,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["submission-activities", id],
    queryFn: () => activitiesApi.list(id as string),
    enabled: !!id && !!user && isDemoMode(),
  });

  const getUserById = useMemo(
    () => buildUserDirectory(submission ? [submission] : []),
    [submission],
  );

  const reviewerSlots = useMemo(
    () => (submission ? getReviewerSlots(submission) : []),
    [submission],
  );

  const { data: reviewerUsers = [] } = useQuery({
    queryKey: ["users", "candidates", "REVIEWER"],
    queryFn: () => usersApi.candidates("REVIEWER"),
    enabled: !!user && reviewerSlots.length > 0,
  });

  const getReviewer = useMemo(() => {
    return (reviewerId: string, index: number) => {
      const fromDirectory = reviewerUsers.find((candidate) => candidate.id === reviewerId);
      if (fromDirectory) {
        return {
          name: fromDirectory.name,
          avatarUrl: fromDirectory.avatarUrl,
        };
      }
      if (reviewerId === submission?.reviewerId && submission.reviewerName) {
        return { name: submission.reviewerName };
      }
      return { name: `Reviewer ${index + 1}` };
    };
  }, [reviewerUsers, submission?.reviewerId, submission?.reviewerName]);

  const canViewPeerReviewReports =
    !!user &&
    !!submission &&
    !user.roles.includes("author") &&
    (user.roles.some((role) =>
      ["publisher_admin", "editor_in_chief", "handling_editor"].includes(role),
    ) ||
      (user.roles.includes("reviewer") && isReviewerOnSubmission(submission, user.id)));

  const scope = submission && user ? buildSubmissionScope(submission, user.id) : undefined;

  usePermissions(scope);

  const visibleFiles = useMemo(() => {
    if (!submission || !user) return [];
    const isAuthorDuringProof =
      submission.authorId === user.id && !!submission.proofReady;
    return getVisibleSubmissionFiles(
      submission.files,
      user.roles,
      submission.authorId === user.id,
      isAuthorDuringProof,
    );
  }, [submission, user]);

  if (isLoading) {
    return (
      <AuthenticatedLayout breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Submissions", href: routes.submissions }, { label: "…" }]}>
        <p className="text-sm text-muted-foreground">Loading submission…</p>
      </AuthenticatedLayout>
    );
  }

  if (!submission) {
    return (
      <AuthenticatedLayout breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Submissions", href: routes.submissions }]}>
        <div className="mx-auto max-w-4xl space-y-4 pb-8">
          <p className="text-sm text-muted-foreground">This submission does not exist.</p>
          <Button asChild variant="outline" className="h-9 rounded-lg px-4 text-sm">
            <Link to={routes.submissions}>Back to submissions</Link>
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (user && !canViewSubmission(submission, user.roles, user.id)) {
    const fallback = user.roles.includes("layout_editor") ? routes.production : routes.dashboard;
    return <Navigate to={fallback} replace />;
  }

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Submissions", href: routes.submissions },
        { label: submission.submissionNumber },
      ]}
    >
      <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
                {submission.title}
              </h1>
              <p className="font-mono text-sm text-muted-foreground">
                {submission.submissionNumber}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <SubmissionPaymentChip submission={submission} />
              <StatusBadge status={submission.status} />
            </div>
          </div>
        </div>

        <SubmissionPositionSummary
          submission={submission}
          getUserById={getUserById}
        />

        <SubmissionWorkflowActions submission={submission} />

        {canViewPeerReviewReports ? (
          <ReviewerReportsDisplay
            submission={submission}
            getReviewer={getReviewer}
            currentUserId={user?.id}
          />
        ) : null}

        <DecisionFeedbackDisplay submission={submission} />

        <Tabs defaultValue="metadata" className="space-y-4">
          <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border/80 bg-transparent p-0">
            {["metadata", "authors", "files", "timeline"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 text-sm capitalize text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:text-foreground"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="metadata" className="mt-0">
            <ArticleInformationSection submission={submission} getUserById={getUserById} />
          </TabsContent>

          <TabsContent value="authors" className="mt-0">
            <AuthorsSection authors={submission.authors} />
          </TabsContent>

          <TabsContent value="files" className="mt-0">
            <DetailSection title="Files">
              {visibleFiles.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">No files uploaded.</p>
              ) : (
                <ul className="divide-y divide-border/80">
                  {visibleFiles.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs capitalize text-muted-foreground">
                          {file.type.replace(/_/g, " ")}
                        </p>
                        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title={`Download ${file.name}`}
                        onClick={async () => {
                          try {
                            const url = await getFileDownloadUrl(submission.id, file.id);
                            window.open(url, "_blank", "noopener,noreferrer");
                          } catch {
                            toast({
                              title: "Download unavailable",
                              description: "Could not get a download link for this file.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <DetailSection title="Timeline">
              <div className="px-4 py-4">
                {isDemoMode() ? (
                  activitiesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading activity history…</p>
                  ) : (
                    <Timeline
                      entries={activities}
                      currentStatus={submission.status}
                      submission={submission}
                      getUserById={getUserById}
                      showStatusBanner={false}
                    />
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Activity history is not available in this environment yet.
                  </p>
                )}
              </div>
            </DetailSection>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};

export default SubmissionDetailPage;
