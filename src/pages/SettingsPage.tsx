import { useEffect, useState } from "react";
import { Settings, User, Banknote, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { ProfileAvatarEditor } from "@/components/shared/ProfileAvatarEditor";
import { AuthorMembershipChip } from "@/components/shared/AuthorMembershipChip";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useJournalStore } from "@/lib/store/store";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const settings = useJournalStore((s) => s.journalSettings);
  const paymentSettings = useJournalStore((s) => s.paymentSettings);
  const updatePaymentSettings = useJournalStore((s) => s.updatePaymentSettings);
  const getUserById = useJournalStore((s) => s.getUserById);
  const updatedBy = getUserById(settings.updatedBy);
  const paymentUpdatedBy = getUserById(paymentSettings.updatedBy);

  const canEditPayment = can("author_payment", "edit");

  const [paymentForm, setPaymentForm] = useState({
    enabled: paymentSettings.enabled,
    amount: String(paymentSettings.amount),
    currency: paymentSettings.currency,
    bankName: paymentSettings.bankName,
    accountName: paymentSettings.accountName,
    accountNumber: paymentSettings.accountNumber,
    transferInstructions: paymentSettings.transferInstructions ?? "",
  });

  useEffect(() => {
    setPaymentForm({
      enabled: paymentSettings.enabled,
      amount: String(paymentSettings.amount),
      currency: paymentSettings.currency,
      bankName: paymentSettings.bankName,
      accountName: paymentSettings.accountName,
      accountNumber: paymentSettings.accountNumber,
      transferInstructions: paymentSettings.transferInstructions ?? "",
    });
  }, [paymentSettings]);

  const handleSavePaymentSettings = () => {
    if (!user) return;
    const amount = Number(paymentForm.amount);
    if (!paymentForm.bankName || !paymentForm.accountName || !paymentForm.accountNumber || !amount) {
      toast({
        title: t("settings.submissionFee.validationError"),
        variant: "destructive",
      });
      return;
    }
    updatePaymentSettings(
      {
        enabled: paymentForm.enabled,
        amount,
        currency: paymentForm.currency.trim() || "IDR",
        bankName: paymentForm.bankName.trim(),
        accountName: paymentForm.accountName.trim(),
        accountNumber: paymentForm.accountNumber.trim(),
        transferInstructions: paymentForm.transferInstructions.trim() || undefined,
      },
      user.id,
    );
    toast({ title: t("settings.submissionFee.saved") });
  };

  const rows = [
    { label: t("settings.journalFields.journalName"), value: settings.journalName },
    { label: t("settings.journalFields.shortName"), value: settings.shortName },
    { label: t("settings.journalFields.publisher"), value: settings.publisher },
    { label: t("settings.journalFields.issn"), value: settings.issn },
    { label: t("settings.journalFields.contactEmail"), value: settings.contactEmail },
    {
      label: t("settings.journalFields.reviewPolicy"),
      value: settings.reviewPolicy.replace(/-/g, " "),
    },
    { label: t("settings.journalFields.defaultLanguage"), value: settings.defaultLanguage },
    {
      label: t("settings.journalFields.lastUpdated"),
      value: `${new Date(settings.updatedAt).toLocaleString()}${updatedBy ? ` by ${updatedBy.name}` : ""}`,
    },
  ];

  return (
    <AuthenticatedLayout
      title={t("settings.title")}
      breadcrumbs={[
        { label: t("common.dashboard"), href: routes.dashboard },
        { label: t("settings.title") },
      ]}
    >
      <Card className="rounded-xl shadow-sm mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("settings.profile.title")}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{t("settings.profile.subtitle")}</p>
            </div>
            <AuthorMembershipChip />
          </div>
        </CardHeader>
        <CardContent>
          <ProfileAvatarEditor />
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Languages className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("settings.language.title")}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{t("settings.language.subtitle")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("settings.journalConfig.title")}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {t("settings.journalConfig.subtitle", { shortName: settings.shortName })}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-lg ml-auto">
              {updatedBy?.roles.map((r) => ROLE_LABELS[r]).join(", ") ?? "Admin"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-100">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-4 first:pt-0 last:pb-0"
              >
                <dt className="text-sm font-medium text-gray-500">{row.label}</dt>
                <dd className="text-sm text-gray-900 sm:col-span-2 capitalize">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {canEditPayment && (
        <Card className="rounded-xl shadow-sm mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{t("settings.submissionFee.title")}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{t("settings.submissionFee.subtitle")}</p>
              </div>
              {paymentUpdatedBy && (
                <Badge variant="secondary" className="rounded-lg ml-auto">
                  {t("settings.submissionFee.updated", {
                    date: new Date(paymentSettings.updatedAt).toLocaleDateString(),
                  })}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t("settings.submissionFee.requirePayment")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("settings.submissionFee.requirePaymentHint")}
                </p>
              </div>
              <Switch
                checked={paymentForm.enabled}
                onCheckedChange={(checked) =>
                  setPaymentForm((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">{t("settings.submissionFee.amount")}</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min={0}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentCurrency">{t("settings.submissionFee.currency")}</Label>
                <Input
                  id="paymentCurrency"
                  value={paymentForm.currency}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, currency: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">{t("settings.submissionFee.bankName")}</Label>
                <Input
                  id="bankName"
                  value={paymentForm.bankName}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, bankName: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">{t("settings.submissionFee.accountName")}</Label>
                <Input
                  id="accountName"
                  value={paymentForm.accountName}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, accountName: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="accountNumber">{t("settings.submissionFee.accountNumber")}</Label>
                <Input
                  id="accountNumber"
                  value={paymentForm.accountNumber}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="transferInstructions">
                  {t("settings.submissionFee.transferInstructions")}
                </Label>
                <Textarea
                  id="transferInstructions"
                  value={paymentForm.transferInstructions}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, transferInstructions: e.target.value }))
                  }
                  className="rounded-xl"
                  rows={3}
                />
              </div>
            </div>

            <Button className="rounded-xl" onClick={handleSavePaymentSettings}>
              {t("settings.submissionFee.save")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t("settings.guidelines.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 leading-relaxed">{settings.submissionGuidelines}</p>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
