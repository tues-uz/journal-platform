import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/useAuth";
import {
  getLatestPaymentForAuthor,
  hasApprovedPayment,
  isPureAuthor,
} from "@/lib/payment/access";
import { useJournalStore } from "@/lib/store/store";

export function AuthorMembershipChip() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const payments = useJournalStore((s) => s.payments);
  const paymentSettings = useJournalStore((s) => s.paymentSettings);

  if (!user || !isPureAuthor(user.roles)) {
    return null;
  }

  if (!paymentSettings.enabled) {
    return (
      <Badge variant="secondary" className="rounded-lg ml-auto bg-gray-100 text-gray-700">
        {t("membership.standardAccount")}
      </Badge>
    );
  }

  if (hasApprovedPayment(user.id, payments)) {
    return (
      <Badge
        variant="secondary"
        className="rounded-lg ml-auto bg-green-100 text-green-800 hover:bg-green-100"
      >
        {t("membership.memberPayment")}
      </Badge>
    );
  }

  const latestPayment = getLatestPaymentForAuthor(user.id, payments);
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
