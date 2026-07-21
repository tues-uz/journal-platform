import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentsApi } from "@/lib/api/payments";
import { useToast } from "@/hooks/use-toast";

interface PaymentProofPreviewProps {
  paymentId: string;
}

export function PaymentProofPreview({ paymentId }: PaymentProofPreviewProps) {
  const { toast } = useToast();
  const [opening, setOpening] = useState(false);

  const openProof = async () => {
    setOpening(true);
    try {
      const url = await paymentsApi.getProofDownloadUrl(paymentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: "Download unavailable",
        description: "Could not get a download link for this proof.",
        variant: "destructive",
      });
    } finally {
      setOpening(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-xl"
      disabled={opening}
      onClick={() => void openProof()}
    >
      <Download className="h-4 w-4 mr-2" />
      {opening ? "Opening..." : "View proof"}
    </Button>
  );
}
