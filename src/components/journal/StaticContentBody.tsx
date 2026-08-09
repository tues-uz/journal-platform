import { Link } from "react-router-dom";
import type { StaticPageContent, StaticSection } from "@/lib/journal/staticContent";
import { STATIC_PAGE_IMAGES } from "@/lib/journal/staticContent";
import { PublicBreadcrumb } from "@/components/JournalSidebar";
import { routes } from "@/app/routes";

interface StaticContentBodyProps {
  content: StaticPageContent;
}

function isLeadSection(section: StaticSection, index: number): boolean {
  return index === 0 && !section.heading;
}

function resolveImage(content: StaticPageContent): { src: string; alt: string } {
  if (content.image) {
    return {
      src: content.image,
      alt: content.imageAlt ?? content.title,
    };
  }

  const crumb = content.breadcrumb?.[0]?.toLowerCase() ?? "";
  if (crumb.includes("editorial") || crumb.includes("policy")) {
    return { src: STATIC_PAGE_IMAGES.policy, alt: content.title };
  }
  if (crumb.includes("information")) {
    return { src: STATIC_PAGE_IMAGES.information, alt: content.title };
  }

  return { src: STATIC_PAGE_IMAGES.default, alt: content.title };
}

function SectionBody({ section }: { section: StaticSection }) {
  return (
    <>
      {section.heading && (
        <h2 className="mb-3 font-serif text-2xl font-bold tracking-wide text-black">
          {section.heading}
        </h2>
      )}
      <div className="space-y-3">
        {section.paragraphs.map((paragraph, pIndex) => (
          <p key={pIndex} className="text-base leading-relaxed text-gray-600">
            {paragraph}
          </p>
        ))}
      </div>
      {section.bullets && (
        <ul className="mt-5 space-y-2.5">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-base leading-relaxed text-gray-700">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#1a3a2f]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function StaticContentBody({ content }: StaticContentBodyProps) {
  const image = resolveImage(content);
  const [lead, ...rest] = content.sections;
  const leadIsIntro = lead ? isLeadSection(lead, 0) : false;
  const bodySections = leadIsIntro ? rest : content.sections;
  const kicker = content.kicker ?? content.breadcrumb?.[0] ?? "Journal";

  return (
    <article>
      {content.breadcrumb && content.breadcrumb.length > 0 && (
        <PublicBreadcrumb
          items={content.breadcrumb.slice(0, -1).map((label) => ({ label })).concat({
            label: content.breadcrumb![content.breadcrumb!.length - 1],
          })}
        />
      )}

      <div className="grid items-stretch gap-8 md:grid-cols-12 md:gap-10">
        <div className="relative min-h-[16rem] overflow-hidden bg-gray-100 md:col-span-5 md:min-h-[22rem] lg:min-h-[26rem]">
          <img src={image.src} alt={image.alt} className="absolute inset-0 h-full w-full object-cover" />
        </div>

        <div className="flex flex-col justify-end md:col-span-7">
          <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">{kicker}</p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-wide text-black md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {content.title}
          </h1>

          {lead && leadIsIntro && (
            <div className="mt-5 max-w-xl space-y-3">
              {lead.paragraphs.map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className={
                    pIndex === 0
                      ? "text-base leading-relaxed text-gray-700 md:text-lg"
                      : "text-sm leading-relaxed text-gray-600 md:text-base"
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={routes.register}
              className="inline-flex items-center gap-2 bg-[#1a3a2f] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#142e26]"
            >
              Submit a manuscript
              <span aria-hidden>→</span>
            </Link>
            <Link
              to={routes.current}
              className="inline-flex items-center gap-2 border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900"
            >
              Current issue
            </Link>
          </div>
        </div>
      </div>

      {content.meta && content.meta.length > 0 && (
        <dl className="mt-10 grid grid-cols-2 gap-px bg-gray-200 md:grid-cols-4">
          {content.meta.map((item) => (
            <div key={item.label} className="bg-white px-4 py-5 md:px-5">
              <dt className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                {item.label}
              </dt>
              <dd className="mt-2 text-sm font-medium leading-snug text-gray-950 break-words">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {bodySections.length > 0 && (
        <div className="mt-12 max-w-3xl space-y-10">
          {bodySections.map((section, index) => (
            <section key={index}>
              <SectionBody section={section} />
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
