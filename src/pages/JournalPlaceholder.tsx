import { Link, useLocation } from "react-router-dom";
import JournalHeader from "@/components/JournalHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FileText, Users, Tag, Info, ArrowLeft } from "lucide-react";

const JOURNAL_PLACEHOLDER_CONFIG: Record<string, { icon: typeof FileText; title: string }> = {
  articles: { icon: FileText, title: "Articles" },
  authors: { icon: Users, title: "Authors" },
  topics: { icon: Tag, title: "Topics" },
  about: { icon: Info, title: "About" },
};

const JournalPlaceholder = () => {
  const location = useLocation();
  const section = location.pathname.split("/").filter(Boolean).pop() ?? "";
  const config = JOURNAL_PLACEHOLDER_CONFIG[section] ?? { icon: FileText, title: "Journal" };
  const Icon = config.icon;
  const title = config.title;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <JournalHeader />
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-foreground/50" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-foreground/60 mb-6 max-w-sm text-center">This section is coming soon.</p>
        <Link to="/journal">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Journal
          </Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
};

export default JournalPlaceholder;
