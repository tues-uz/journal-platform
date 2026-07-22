import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/useAuth";
import { isPureAuthor } from "@/lib/payment/access";
import { useAuthorSubmissionAccess } from "@/lib/payment/useAuthorSubmissionAccess";

export function AuthorMembershipChip() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { paymentSettings, latestPayment } = useAuthorSubmissionAccess();

  if (!user || !isPureAuthor(user.roles)) {
    return null;
  }

  if (!paymentSettings?.enabled) {
    return (
      <Badge variant="secondary" className="rounded-lg ml-auto bg-gray-100 text-gray-700">
        {t("membership.standardAccount")}
      </Badge>
    );
  }

  if (latestPayment?.status === "approved") {
    return (
      <Badge
        variant="secondary"
        className="rounded-lg ml-auto bg-green-100 text-green-800 hover:bg-green-100"
      >
        {t("membership.memberPayment")}
      </Badge>
    );
  }

  if (latestPayment?.status === "pending_review") {
    return (
      <Badge
        variant="secondary"
        className="rounded-lg ml-auto bg-amber-100 text-amber-800 hover:bg-amber-100"
      >
        {t("membership.paymentPending")}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="rounded-lg ml-auto bg-gray-100 text-gray-700">
      {t("membership.standardAccount")}
    </Badge>
  );
}
