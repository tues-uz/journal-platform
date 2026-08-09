import { Link, useLocation } from "react-router-dom";
import { Download } from "lucide-react";
import { routes } from "@/app/routes";
import {
  ACCREDITATION_LINK,
  BROWSE_LINKS,
  EDITORIAL_POLICY_LINKS,
  INFORMATION_LINKS,
  TEMPLATE_LINKS,
  type SidebarLink,
} from "@/lib/journal/publicNav";

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-bold tracking-wide text-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SidebarDownloadList({ links }: { links: SidebarLink[] }) {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.path}>
          <a
            href={link.path}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border-b border-gray-200 py-3.5 transition-colors hover:border-gray-400"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-sm font-medium leading-snug text-gray-900 transition-colors group-hover:text-black">
                {link.label}
              </span>
              <Download
                className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-y-0.5 group-hover:text-gray-700"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <p className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
              {link.fileType && (
                <span className="border border-gray-200 px-1.5 py-0.5 text-[10px] font-semibold tracking-widest text-gray-600 uppercase">
                  {link.fileType}
                </span>
              )}
              {link.fileSize && <span>{link.fileSize}</span>}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}

function SidebarLinkList({ links }: { links: SidebarLink[] }) {
  const { pathname } = useLocation();

  return (
    <ul className="space-y-2.5">
      {links.map((link) => {
        const isActive = !link.external && (pathname === link.path || pathname.startsWith(`${link.path}/`));
        const className = `block text-sm leading-snug transition-colors ${
          isActive
            ? "font-medium text-gray-950 underline decoration-gray-300 underline-offset-4"
            : "text-gray-600 hover:text-gray-950"
        }`;

        return (
          <li key={link.path}>
            {link.external ? (
              <a href={link.path} target="_blank" rel="noopener noreferrer" className={className}>
                {link.label}
              </a>
            ) : (
              <Link to={link.path} className={className} aria-current={isActive ? "page" : undefined}>
                {link.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const JournalSidebar = ({ align = "left" }: { align?: "left" | "right" }) => {
  const borderClass =
    align === "right" ? "lg:border-l lg:pl-8" : "lg:border-r lg:pr-8";

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className={`space-y-10 border-gray-200 lg:sticky lg:top-24 ${borderClass}`}>
        <SidebarSection title="Editorial Policies">
          <SidebarLinkList links={EDITORIAL_POLICY_LINKS} />
        </SidebarSection>

        <SidebarSection title="Accreditation">
          <p className="text-sm leading-relaxed text-gray-600">
            Transparent editorial standards and regional indexing for TUES Economics Journal.
          </p>
          <a
            href={ACCREDITATION_LINK.path}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 border border-gray-900 bg-gray-950 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800"
          >
            {ACCREDITATION_LINK.label}
          </a>
        </SidebarSection>

        <SidebarSection title="Template">
          <SidebarDownloadList links={TEMPLATE_LINKS} />
        </SidebarSection>

        <SidebarSection title="Information">
          <SidebarLinkList links={INFORMATION_LINKS} />
        </SidebarSection>

        <SidebarSection title="Browse">
          <SidebarLinkList links={BROWSE_LINKS} />
        </SidebarSection>
      </div>
    </aside>
  );
};

export default JournalSidebar;

export function PublicBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
      <Link to={routes.home} className="transition-colors hover:text-gray-900">
        Home
      </Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {" "}
          <span className="text-gray-300">/</span>{" "}
          {item.href ? (
            <Link to={item.href} className="transition-colors hover:text-gray-900">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
