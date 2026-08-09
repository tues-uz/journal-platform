import JournalHeader from "@/components/JournalHeader";
import JournalSidebar from "@/components/JournalSidebar";
import Footer from "@/components/Footer";

interface PublicJournalLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const PublicJournalLayout = ({ children, showSidebar = true }: PublicJournalLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      <JournalHeader />
      {showSidebar ? (
        <main className="pt-24 pb-16">
          <div className="px-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-start">
              <JournalSidebar />
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </div>
        </main>
      ) : (
        <main className="pb-16">{children}</main>
      )}
      <Footer />
    </div>
  );
};

export default PublicJournalLayout;
