import { Link } from "react-router-dom";
import { JournalLogo } from "@/components/JournalLogo";
import { routes } from "@/app/routes";
import {
  FOOTER_JOURNAL_LINKS,
  FOOTER_META,
  FOOTER_POLICY_LINKS,
  FOOTER_SUBMIT_LINKS,
  INFORMATION_LINKS,
} from "@/lib/journal/publicNav";

function FooterLinkColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-serif text-sm font-bold tracking-wide text-white uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm leading-snug text-gray-400 transition-colors hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-black text-white">
      <div className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 py-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <Link to={routes.home} className="inline-flex items-center gap-2.5">
                <JournalLogo className="h-9 w-auto shrink-0" />
                <span className="leading-[1.05]">
                  <span className="block font-serif text-sm font-bold tracking-wide text-white">
                    Studies in Economics
                  </span>
                  <span className="block font-serif text-sm font-bold tracking-wide text-white">
                    And Finance System
                  </span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">{FOOTER_META.tagline}</p>
              <dl className="mt-5 space-y-1.5 text-xs text-gray-500">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-gray-300">Print ISSN</dt>
                  <dd className="text-gray-400">{FOOTER_META.printIssn}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-gray-300">Online ISSN</dt>
                  <dd className="text-gray-400">{FOOTER_META.onlineIssn}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-gray-300">Publisher</dt>
                  <dd className="text-gray-400">{FOOTER_META.publisher}</dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3 lg:gap-8">
              <FooterLinkColumn title="Journal">
                {FOOTER_JOURNAL_LINKS.map((item) => (
                  <FooterNavLink key={item.path} to={item.path}>
                    {item.name}
                  </FooterNavLink>
                ))}
              </FooterLinkColumn>

              <FooterLinkColumn title="Policies">
                {FOOTER_POLICY_LINKS.map((link) => (
                  <FooterNavLink key={link.path} to={link.path}>
                    {link.label}
                  </FooterNavLink>
                ))}
              </FooterLinkColumn>

              <div>
                <FooterLinkColumn title="Information">
                  {INFORMATION_LINKS.map((link) => (
                    <FooterNavLink key={link.path} to={link.path}>
                      {link.label}
                    </FooterNavLink>
                  ))}
                  {FOOTER_SUBMIT_LINKS.map((item) => (
                    <FooterNavLink key={item.path} to={item.path}>
                      {item.name}
                    </FooterNavLink>
                  ))}
                </FooterLinkColumn>

                <div className="mt-8 border-t border-white/15 pt-6">
                  <p className="text-xs font-medium tracking-wide text-gray-300 uppercase">Editorial office</p>
                  <a
                    href={`mailto:${FOOTER_META.editorialEmail}`}
                    className="mt-2 inline-block text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {FOOTER_META.editorialEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/15 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-400">
              © {year} {FOOTER_META.publisher}. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link
                to={routes.policy("copyright-notice")}
                className="text-gray-400 transition-colors hover:text-white"
              >
                Copyright
              </Link>
              <Link
                to={routes.policy("publication-ethics")}
                className="text-gray-400 transition-colors hover:text-white"
              >
                Publication ethics
              </Link>
              <Link
                to={routes.policy("complaints-process")}
                className="text-gray-400 transition-colors hover:text-white"
              >
                Complaints
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
