export interface LandingArticle {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  image: string;
  category: string;
  readTime: number;
  date: string;
  featured?: boolean;
}

export const LANDING_ARTICLES: LandingArticle[] = [
  {
    id: 1,
    title: "Inflation, Expectations, and Everyday Markets in Central Asia",
    excerpt:
      "TUES economists examine how price expectations are formed in local bazaars, digital marketplaces, and cross‑border trade corridors—and what this means for monetary policy across the region.",
    author: "Dr. Dilshod Karimov",
    authorRole: "Professor of Applied Macroeconomics",
    authorAvatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?auto=format&fit=crop&w=1000&q=80",
    category: "Macroeconomics",
    readTime: 14,
    date: "Mar 15",
    featured: true,
  },
  {
    id: 2,
    title: "Pricing power in small markets: lessons from Termez bazaars",
    excerpt:
      "A field report on how micro‑entrepreneurs adjust prices daily in response to currency shifts and seasonal demand.",
    author: "N. Yuldasheva",
    authorRole: "Student Research",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1542228262-3d6636a87b29?auto=format&fit=crop&w=800&q=80",
    category: "Microeconomics",
    readTime: 6,
    date: "Mar 12",
  },
  {
    id: 3,
    title: "Service‑sector reforms and the future of Uzbek cities",
    excerpt:
      "How coordinated reforms in education, tourism, and public services are reshaping the economic geography of Uzbekistan.",
    author: "Policy Lab at TUES",
    authorRole: "Research Team",
    authorAvatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
    category: "Policy & Reform",
    readTime: 10,
    date: "Mar 10",
  },
  {
    id: 4,
    title: "Visualizing trade flows along the Termez logistics corridor",
    excerpt:
      "A visual guide to goods, services, and data moving through one of Central Asia's most dynamic gateways.",
    author: "Applied Statistics Group",
    authorRole: "Data Visualization Team",
    authorAvatar:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=80",
    category: "Data Notebook",
    readTime: 8,
    date: "Mar 8",
  },
  {
    id: 5,
    title: "Experiments in behavioral finance with TUES undergraduates",
    excerpt:
      "Students document portfolio‑choice experiments, framing effects, and loss aversion in a controlled lab environment.",
    author: "Student Economics Society",
    authorRole: "Student Research",
    authorAvatar:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
    category: "Workshop Notes",
    readTime: 5,
    date: "Mar 5",
  },
  {
    id: 6,
    title: "Mapping student entrepreneurship across Termez",
    excerpt:
      "A data‑driven look at start‑ups, side‑hustles, and service micro‑businesses run by TUES students.",
    author: "Innovation & Start‑up Lab",
    authorRole: "Research Team",
    authorAvatar:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
    category: "Campus Data",
    readTime: 7,
    date: "Mar 3",
  },
  {
    id: 7,
    title: "Digital transformation in Central Asian banking systems",
    excerpt:
      "An analysis of how fintech innovations are reshaping traditional banking models across Uzbekistan and neighboring countries.",
    author: "Dr. Alisher Toshmatov",
    authorRole: "Professor of Financial Economics",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    category: "Financial Markets",
    readTime: 12,
    date: "Mar 1",
  },
  {
    id: 8,
    title: "Agricultural policy reforms and rural economic development",
    excerpt:
      "Examining the impact of recent policy changes on agricultural productivity and rural livelihoods in Uzbekistan.",
    author: "Rural Economics Research Group",
    authorRole: "Research Team",
    authorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
    category: "Development Economics",
    readTime: 15,
    date: "Feb 28",
  },
  {
    id: 9,
    title: "Behavioral nudges in public transport pricing",
    excerpt:
      "A field experiment exploring how small changes in pricing structures can influence commuter behavior and system efficiency.",
    author: "Dr. Malika Karimova",
    authorRole: "Behavioral Economics Lab",
    authorAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80",
    category: "Behavioral Economics",
    readTime: 7,
    date: "Feb 25",
  },
  {
    id: 10,
    title: "Student trading labs and digital asset simulations",
    excerpt:
      "How TUES students use virtual trading platforms to understand market dynamics and develop financial literacy skills.",
    author: "Student Economics Society",
    authorRole: "Student Research",
    authorAvatar:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    category: "Financial Markets",
    readTime: 9,
    date: "Feb 22",
  },
  {
    id: 11,
    title: "Tourism, services, and post‑pandemic recovery",
    excerpt:
      "Analyzing the resilience and transformation of Uzbekistan's tourism sector in the wake of global travel disruptions.",
    author: "Tourism Economics Research Center",
    authorRole: "Research Team",
    authorAvatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80",
    category: "International Trade",
    readTime: 11,
    date: "Feb 20",
  },
  {
    id: 12,
    title: "Gender gaps in labor market participation: evidence from Central Asia",
    excerpt:
      "A comprehensive study examining barriers and opportunities for women's economic participation across the region.",
    author: "Dr. Feruza Nasirova",
    authorRole: "Labor Economics Department",
    authorAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    category: "Public Policy",
    readTime: 13,
    date: "Feb 18",
  },
  {
    id: 13,
    title: "Climate change adaptation strategies for Central Asian economies",
    excerpt:
      "Exploring economic policies and market mechanisms to address climate risks in water-scarce regions.",
    author: "Environmental Economics Group",
    authorRole: "Research Team",
    authorAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
    category: "Development Economics",
    readTime: 16,
    date: "Feb 15",
  },
  {
    id: 14,
    title: "E-commerce growth and traditional retail transformation",
    excerpt:
      "How digital marketplaces are reshaping consumer behavior and business models in Uzbekistan's retail sector.",
    author: "Digital Economy Research Lab",
    authorRole: "Research Team",
    authorAvatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
    category: "Microeconomics",
    readTime: 10,
    date: "Feb 12",
  },
  {
    id: 15,
    title: "Monetary policy transmission mechanisms in emerging markets",
    excerpt:
      "Investigating how central bank policies affect real economic outcomes in small open economies.",
    author: "Dr. Shavkat Mirziyoyev",
    authorRole: "Monetary Policy Research",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
    category: "Macroeconomics",
    readTime: 14,
    date: "Feb 10",
  },
];

export function matchesLandingArticleSearch(article: LandingArticle, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    article.title.toLowerCase().includes(q) ||
    article.excerpt.toLowerCase().includes(q) ||
    article.author.toLowerCase().includes(q) ||
    article.category.toLowerCase().includes(q) ||
    article.authorRole.toLowerCase().includes(q)
  );
}

export function matchesLandingArticleTopic(article: LandingArticle, topic: string): boolean {
  if (topic === "All") return true;

  const normalizedTopic = topic.toLowerCase();
  return (
    article.category.toLowerCase().includes(normalizedTopic) ||
    article.authorRole.toLowerCase().includes(normalizedTopic) ||
    article.title.toLowerCase().includes(normalizedTopic)
  );
}

export function filterLandingArticles(
  articles: LandingArticle[],
  query: string,
  topic: string,
): LandingArticle[] {
  return articles.filter(
    (article) =>
      matchesLandingArticleTopic(article, topic) &&
      matchesLandingArticleSearch(article, query),
  );
}

export function getLandingArticleById(id: string | number): LandingArticle | undefined {
  const numericId = typeof id === "string" ? Number.parseInt(id, 10) : id;
  if (Number.isNaN(numericId)) return undefined;
  return LANDING_ARTICLES.find((article) => article.id === numericId);
}

export function buildArticleBody(article: {
  title: string;
  excerpt: string;
  author: string;
  category: string;
  authorRole?: string;
}): string[] {
  return [
    article.excerpt,
    `In this ${article.category.toLowerCase()} piece, ${article.author} examines patterns that are often invisible in aggregate national statistics but visible in everyday economic life across Central Asia.`,
    "The research combines qualitative interviews with quantitative indicators gathered over the past twelve months. Field teams visited markets, offices, and logistics hubs to understand how local actors respond to changing economic conditions.",
    "Early findings suggest that expectations matter as much as fundamentals. When households and small businesses anticipate price or policy shifts, their behavior can amplify or dampen broader trends—a dynamic that standard models often understate in emerging market contexts.",
    "The authors also highlight institutional constraints: limited access to credit, fragmented data systems, and informal networks that shape how information spreads between traders, consumers, and policymakers.",
    "Looking ahead, the study argues for more localized data collection and clearer communication from public authorities. Without credible signals, informal markets continue to serve as the primary venue where expectations are formed and tested.",
    article.authorRole
      ? `As ${article.authorRole}, ${article.author} emphasizes that translating academic insight into everyday policy requires ongoing dialogue between researchers, traders, and public institutions.`
      : `${article.author} concludes that rigorous local evidence should inform both classroom teaching and policy design in the region.`,
  ];
}
