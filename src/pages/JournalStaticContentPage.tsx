import { Navigate, useParams } from "react-router-dom";
import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { StaticContentBody } from "@/components/journal/StaticContentBody";
import {
  ABOUT_PAGE,
  getInformationPage,
  getPolicyPage,
  isValidInformationSlug,
  isValidPolicySlug,
} from "@/lib/journal/staticContent";
import { routes } from "@/app/routes";

type StaticPageKind = "policy" | "information" | "about";

interface JournalStaticContentPageProps {
  kind: StaticPageKind;
}

const JournalStaticContentPage = ({ kind }: JournalStaticContentPageProps) => {
  const { slug = "" } = useParams();

  if (kind === "about") {
    return (
      <PublicJournalLayout>
        <StaticContentBody content={ABOUT_PAGE} />
      </PublicJournalLayout>
    );
  }

  if (kind === "policy") {
    if (!isValidPolicySlug(slug)) {
      return <Navigate to={routes.home} replace />;
    }
    const content = getPolicyPage(slug);
    if (!content) {
      return <Navigate to={routes.home} replace />;
    }
    return (
      <PublicJournalLayout>
        <StaticContentBody content={content} />
      </PublicJournalLayout>
    );
  }

  if (!isValidInformationSlug(slug)) {
    return <Navigate to={routes.home} replace />;
  }
  const content = getInformationPage(slug);
  if (!content) {
    return <Navigate to={routes.home} replace />;
  }

  return (
    <PublicJournalLayout>
      <StaticContentBody content={content} />
    </PublicJournalLayout>
  );
};

export default JournalStaticContentPage;
