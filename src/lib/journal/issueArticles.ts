export interface IssueArticle {
  id: string;
  title: string;
  authors: string;
  authorList: string[];
  pages: string;
  doi: string;
  abstract: string;
  pdfUrl: string;
  category: string;
  publishedAt: string;
  references: string[];
  keywords: string[];
}

export interface IssueCatalogEntry {
  slug: string;
  label: string;
  doi?: string;
  sectionTitle: string;
  articles: IssueArticle[];
}

export const CURRENT_ISSUE_SLUG = "vol-3-no-2";

const REFERENCE_POOLS: Record<string, string[]> = {
  Macroeconomics: [
    "Bernanke, B. S., & Gertler, M. (1995). Inside the black box: The credit channel of monetary policy transmission. Journal of Economic Perspectives, 9(4), 27–48.",
    "Christiano, L. J., Eichenbaum, M., & Evans, C. L. (2005). Nominal rigidities and the dynamic effects of a shock to monetary policy. Journal of Political Economy, 113(1), 1–45.",
    "Mishkin, F. S. (1996). The channels of monetary transmission: Lessons for monetary policy. NBER Working Paper No. 5464.",
    "Rey, H. (2013). Dilemma not trilemma: The global financial cycle and monetary policy independence. Jackson Hole Symposium Proceedings, Federal Reserve Bank of Kansas City.",
    "Taylor, J. B. (1993). Discretion versus policy rules in practice. Carnegie-Rochester Conference Series on Public Policy, 39, 195–214.",
    "Uribe, M., & Schmitt-Grohé, S. (2017). Open economy macroeconomics. Princeton University Press.",
    "Woodford, M. (2003). Interest and prices: Foundations of a theory of monetary policy. Oxford University Press.",
  ],
  "Development Economics": [
    "Acemoglu, D., & Restrepo, P. (2018). The race between man and machine: Implications of technology for growth, factor shares, and employment. American Economic Review, 108(6), 1488–1542.",
    "Banerjee, A., & Duflo, E. (2011). Poor economics: A radical rethinking of the way to fight global poverty. PublicAffairs.",
    "Besley, T., & Burgess, R. (2004). Can labor regulation hinder economic performance? Evidence from India. Quarterly Journal of Economics, 119(1), 91–134.",
    "Blanchard, O., & Katz, L. F. (1997). What we know and do not know about the natural rate of unemployment. Journal of Economic Perspectives, 11(1), 51–72.",
    "ILO. (2022). World employment and social outlook: Trends 2022. International Labour Organization.",
    "World Bank. (2023). World development report: The future of work. World Bank Group.",
    "Autor, D. H., Levy, F., & Murnane, R. J. (2003). The skill content of recent technological change. Quarterly Journal of Economics, 118(4), 1279–1333.",
  ],
  "Financial Markets": [
    "Demirgüç-Kunt, A., Klapper, L., Singer, D., & Ansar, S. (2018). The Global Findex Database 2017. World Bank Policy Research Working Paper No. 8308.",
    "Karlan, D., & Zinman, J. (2010). Expanding credit access. American Economic Journal: Applied Economics, 2(3), 1–31.",
    "Suri, T., & Jack, W. (2016). The long-run poverty and gender impacts of mobile money. Science, 354(6317), 1288–1292.",
    "Beck, T., Demirgüç-Kunt, A., & Levine, R. (2007). Finance, inequality and the poor. Journal of Economic Growth, 12(1), 27–49.",
    "Philippon, T. (2019). The fintech opportunity. BIS Working Paper No. 779.",
    "Buchak, G., Matvos, G., Piskorski, T., & Seru, A. (2018). Fintech, regulatory arbitrage, and the rise of shadow banks. Journal of Financial Economics, 130(3), 453–483.",
  ],
  "Public Policy": [
    "Goulder, L. H., & Parry, I. W. H. (2008). Instrument choice in environmental policy. Review of Environmental Economics and Policy, 2(2), 152–174.",
    "Martin, R., de Preux, L. B., & Wagner, U. J. (2014). The impact of a carbon tax on manufacturing: Evidence from microdata. Journal of Public Economics, 117, 1–14.",
    "Metcalf, G. E., & Stock, J. H. (2020). Measuring the macroeconomic impact of carbon taxes. AEA Papers and Proceedings, 110, 101–106.",
    "Porter, M. E., & van der Linde, C. (1995). Toward a new conception of the environment-competitiveness relationship. Journal of Economic Perspectives, 9(4), 97–118.",
    "Stern, N. (2007). The economics of climate change: The Stern review. Cambridge University Press.",
    "IPCC. (2023). Climate change 2023: Synthesis report. Intergovernmental Panel on Climate Change.",
  ],
  "International Trade": [
    "Autor, D. H., Dorn, D., & Hanson, G. H. (2013). The China syndrome: Local labor market effects of import competition. American Economic Review, 103(6), 2121–2168.",
    "Donaldson, D., & Hornbeck, R. (2016). Railroads and American economic growth. Quarterly Journal of Economics, 131(2), 799–858.",
    "Fajgelbaum, P. D., & Khandelwal, A. K. (2016). Measuring the unequal gains from trade. Quarterly Journal of Economics, 131(3), 1113–1180.",
    "Krugman, P. R. (1991). Increasing returns and economic geography. Journal of Political Economy, 99(3), 483–499.",
    "Melitz, M. J. (2003). The impact of trade on intra-industry reallocations and aggregate industry productivity. Econometrica, 71(6), 1695–1725.",
    "Rodríguez-Pose, A. (2018). The revenge of the places that don't matter. Cambridge Journal of Regions, Economy and Society, 11(1), 189–209.",
  ],
  "Behavioral Economics": [
    "Chetty, R., Looney, A., & Kroft, K. (2009). Salience and taxation: Theory and evidence. American Economic Review, 99(4), 1145–1177.",
    "Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. Econometrica, 47(2), 263–291.",
    "Saez, E. (2010). Do taxpayers bunch at kink points? American Economic Journal: Economic Policy, 2(3), 180–212.",
    "Thaler, R. H., & Sunstein, C. R. (2008). Nudge: Improving decisions about health, wealth, and happiness. Yale University Press.",
    "Allingham, M. G., & Sandmo, A. (1972). Income tax evasion: A theoretical analysis. Journal of Public Economics, 1(3–4), 323–338.",
    "Blumenthal, M., Christian, C., & Slemrod, J. (2001). Do normative appeals affect tax compliance? Journal of Legal Studies, 30(2), 495–512.",
  ],
  Research: [
    "Angrist, J. D., & Pischke, J.-S. (2009). Mostly harmless econometrics. Princeton University Press.",
    "Cameron, A. C., & Trivedi, P. K. (2005). Microeconometrics: Methods and applications. Cambridge University Press.",
    "Imbens, G. W., & Rubin, D. B. (2015). Causal inference in statistics, social, and biomedical sciences. Cambridge University Press.",
    "Wooldridge, J. M. (2010). Econometric analysis of cross section and panel data (2nd ed.). MIT Press.",
    "Stock, J. H., & Watson, M. W. (2012). Introduction to econometrics (3rd ed.). Pearson.",
    "Hausman, J. A. (1978). Specification tests in econometrics. Econometrica, 46(6), 1251–1271.",
  ],
};

function buildReferences(category: string, seed: string): string[] {
  const pool = REFERENCE_POOLS[category] ?? REFERENCE_POOLS.Research;
  const offset = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % pool.length;
  const count = Math.min(6, pool.length);
  return Array.from({ length: count }, (_, index) => pool[(offset + index) % pool.length]);
}

function buildKeywords(category: string, title: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !["using", "among", "between", "through", "within"].includes(word))
    .slice(0, 3);

  return [...new Set([category, ...words, "emerging markets", "empirical analysis"])].slice(0, 6);
}

export interface IssueArticleSection {
  heading: string;
  paragraphs: string[];
}

export function buildIssueArticleSections(article: IssueArticle): IssueArticleSection[] {
  const lead = article.authorList[0];
  const topic = article.category.toLowerCase();

  return [
    {
      heading: "1. Introduction",
      paragraphs: [
        `${article.abstract} This paper contributes to the ${topic} literature by assembling new evidence and evaluating policy-relevant mechanisms that are often under-studied outside advanced economies.`,
        `The remainder of the article is organized as follows. Section 2 reviews related work. Section 3 describes the data and empirical strategy. Section 4 presents results, Section 5 discusses implications, and Section 6 concludes.`,
      ],
    },
    {
      heading: "2. Literature review",
      paragraphs: [
        `Prior research in ${topic} emphasizes institutional quality, measurement challenges, and heterogeneous treatment effects across regions. We extend this literature by focusing on settings where administrative records are increasingly available yet still fragmented across agencies.`,
        `Our approach complements reduced-form policy evaluations with diagnostics that help distinguish structural adjustment from short-run volatility. In doing so, we respond to recent calls for transparent identification strategies in applied work published by regional economics journals.`,
      ],
    },
    {
      heading: "3. Data and methods",
      paragraphs: [
        `The analysis combines nationally representative survey waves with firm- and household-level panel components covering 2010–2024. Variables are harmonized across sources, and missing values are addressed using inverse-probability weights where appropriate.`,
        `The baseline specification includes region, year, and sector fixed effects, with standard errors clustered at the primary sampling unit. Alternative estimators and placebo tests are reported in the appendix to assess robustness.`,
      ],
    },
    {
      heading: "4. Results",
      paragraphs: [
        `Baseline estimates indicate economically meaningful effects aligned with the hypotheses stated in the introduction. Magnitudes remain stable after controlling for observable confounders and macroeconomic shocks common to the sample period.`,
        `Event-study coefficients show no significant pre-trends, supporting the interpretation that post-reform changes reflect the policy or market shift under study rather than anticipation effects. Subsample analysis reveals stronger responses among service-sector firms and younger households.`,
      ],
    },
    {
      heading: "5. Discussion",
      paragraphs: [
        `The findings suggest that design details matter as much as headline policy changes. Complementary investments—in training, digital infrastructure, or enforcement capacity—amplify the gains observed in the primary specification.`,
        `${lead} and co-authors note several limitations, including measurement error in informal activity and the possibility of spillovers across neighboring regions that are not fully captured by the current research design.`,
      ],
    },
    {
      heading: "6. Conclusion",
      paragraphs: [
        `This study documents robust patterns in ${topic} with clear relevance for policymakers and researchers working on transition economies. The results support targeted reforms paired with monitoring frameworks that make adjustment paths observable to stakeholders.`,
        `Future work should extend the sample, incorporate administrative microdata linkages, and evaluate welfare implications using structural models calibrated to local labor and product markets.`,
      ],
    },
  ];
}

function article(
  id: string,
  title: string,
  authorList: string[],
  pages: string,
  doiSuffix: string,
  abstract: string,
  category: string,
  publishedAt: string,
): IssueArticle {
  const authors = authorList.join(", ");
  return {
    id,
    title,
    authors,
    authorList,
    pages,
    doi: `https://doi.org/10.00000/tues.v3i2.${doiSuffix}`,
    abstract,
    pdfUrl: `/articles/issues/${id}.pdf`,
    category,
    publishedAt,
    references: buildReferences(category, id),
    keywords: buildKeywords(category, title),
  };
}

const CURRENT_ISSUE_ARTICLES: IssueArticle[] = [
  article(
    "issue-v3i2-01",
    "Monetary Policy Transmission in Emerging Market Economies",
    ["A. Rahman", "S. Chen", "M. Okonkwo"],
    "101–124",
    "01",
    "This study analyzes how interest rate changes propagate through credit markets, exchange rates, and inflation expectations in five emerging economies. Using a structural VAR framework and high-frequency market data, the authors find that transmission is faster in economies with deeper domestic bond markets.",
    "Macroeconomics",
    "2026-04-12",
  ),
  article(
    "issue-v3i2-02",
    "Labor Market Flexibility and Productivity Growth: Evidence from Central Asia",
    ["D. Karimov", "N. Petrova"],
    "125–148",
    "02",
    "Panel data from 2010–2024 show that reforms easing hiring and separation constraints are associated with higher firm-level productivity, especially in services. Effects are strongest where vocational training programs complement labor market liberalization.",
    "Development Economics",
    "2026-04-12",
  ),
  article(
    "issue-v3i2-03",
    "Digital Payment Adoption and Financial Inclusion",
    ["L. Nguyen", "T. Williams", "K. Al-Mansouri"],
    "149–172",
    "03",
    "Survey evidence from rural and peri-urban households links mobile wallet adoption to increased savings participation and reduced remittance costs. The paper quantifies equity gains for previously unbanked women entrepreneurs.",
    "Financial Markets",
    "2026-04-12",
  ),
  article(
    "issue-v3i2-04",
    "Carbon Pricing and Industrial Competitiveness",
    ["E. Schmidt", "F. Morales"],
    "173–196",
    "04",
    "A difference-in-differences design evaluates export performance after the introduction of regional carbon levies. Energy-intensive manufacturers adjust through fuel switching rather than relocation, with modest short-run competitiveness effects.",
    "Public Policy",
    "2026-04-12",
  ),
  article(
    "issue-v3i2-05",
    "Trade Liberalization and Regional Inequality",
    ["H. Park", "J. Silva"],
    "197–218",
    "05",
    "Reduced tariff barriers increased aggregate welfare but widened spatial income gaps between coastal hubs and inland provinces. Place-based investment in logistics infrastructure mitigates roughly one-third of the inequality effect.",
    "International Trade",
    "2026-04-12",
  ),
  article(
    "issue-v3i2-06",
    "Behavioral Responses to Progressive Taxation",
    ["R. Okafor", "P. Lindström"],
    "219–240",
    "06",
    "A framed field experiment tests how disclosure of marginal tax rates affects labor supply among self-employed professionals. Transparency increases compliance without reducing hours worked, suggesting misperception drives part of the avoidance margin.",
    "Behavioral Economics",
    "2026-04-12",
  ),
];

function archiveArticles(prefix: string, count: number, baseYear: number): IssueArticle[] {
  const titles = [
    "Fiscal Multipliers in Small Open Economies",
    "Microfinance and Household Investment Decisions",
    "Exchange Rate Pass-Through to Consumer Prices",
    "Informal Employment and Social Protection Gaps",
    "Green Bonds and Sovereign Borrowing Costs",
  ];

  return titles.slice(0, count).map((title, index) => {
    const num = String(index + 1).padStart(2, "0");
    const pageStart = 100 + index * 24;
    return article(
      `issue-${prefix}-${num}`,
      title,
      [`Author ${index + 1}A`, `Author ${index + 1}B`],
      `${pageStart}–${pageStart + 18}`,
      `${prefix}-${num}`,
      `Archived research article from ${baseYear}. ${title} presents empirical findings relevant to TUES Economics Journal readership.`,
      "Research",
      `${baseYear}-0${(index % 4) + 1}-15`,
    );
  });
}

export const ISSUE_CATALOG: Record<string, IssueCatalogEntry> = {
  [CURRENT_ISSUE_SLUG]: {
    slug: CURRENT_ISSUE_SLUG,
    label: "Vol. 3, No. 2 (2026)",
    doi: "https://doi.org/10.00000/tues.v3i2",
    sectionTitle: "Original Research Articles",
    articles: CURRENT_ISSUE_ARTICLES,
  },
  "vol-3-no-1": {
    slug: "vol-3-no-1",
    label: "Vol. 3, No. 1 (2026)",
    doi: "https://doi.org/10.00000/tues.v3i1",
    sectionTitle: "Original Research Articles",
    articles: archiveArticles("v3i1", 5, 2026),
  },
};

export function getIssueBySlug(slug: string): IssueCatalogEntry | undefined {
  return ISSUE_CATALOG[slug];
}

export function getCurrentIssue(): IssueCatalogEntry {
  return ISSUE_CATALOG[CURRENT_ISSUE_SLUG];
}

export function getIssueArticleById(
  id: string,
): (IssueArticle & { issueLabel: string; issueSlug: string }) | undefined {
  for (const issue of Object.values(ISSUE_CATALOG)) {
    const match = issue.articles.find((entry) => entry.id === id);
    if (match) {
      return { ...match, issueLabel: issue.label, issueSlug: issue.slug };
    }
  }
  return undefined;
}

export function buildIssueArticleBody(article: IssueArticle): string[] {
  return [
    article.abstract,
    `This ${article.category.toLowerCase()} article draws on recent data and policy developments relevant to readers of TUES Economics Journal. The authors combine descriptive evidence with econometric analysis to support their conclusions.`,
    `${article.authorList[0]} and colleagues situate the findings within ongoing debates about institutional design, market structure, and household behavior in emerging and transition economies.`,
    "The study contributes to a growing literature that emphasizes context-specific policy evaluation rather than one-size-fits-all prescriptions from advanced economies.",
    "Policy implications are discussed with attention to feasible implementation constraints, including administrative capacity, data availability, and political economy considerations.",
    `${article.authorList.join(", ")} conclude that further research should extend the sample period and test robustness across subnational regions.`,
  ];
}

export function formatIssueSlugLabel(slug: string): string {
  return slug
    .replace(/^vol-/, "Vol. ")
    .replace(/-no-/g, ", No. ")
    .replace(/-/g, " ");
}
