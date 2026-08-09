/** Top-level browse subjects for the public journal home. */
export const JOURNAL_SUBJECTS = [
  "Macroeconomics",
  "Microeconomics",
  "Policy & Reform",
  "Behavioral Economics",
  "Financial Markets",
  "International Trade",
  "Development Economics",
  "Public Policy",
  "Econometrics",
  "Labor Economics",
  "Environmental Economics",
  "Political Economy",
] as const;

export type JournalSubject = (typeof JOURNAL_SUBJECTS)[number];

/** Unique subjects from the full taxonomy, sorted A–Z. */
export function getSubjectsAZ(): string[] {
  const subjects = new Set<string>();
  for (const group of Object.values(SUBJECT_TAXONOMY)) {
    for (const subject of group) subjects.add(subject);
  }
  return [...subjects].sort((a, b) => a.localeCompare(b));
}

/** Full subject taxonomy grouped for browse / A–Z pages. */
export const SUBJECT_TAXONOMY: Record<string, string[]> = {
  "Core Economics": [
    "General Economics",
    "Economic Theory",
    "Microeconomics",
    "Macroeconomics",
    "Econometrics",
    "Mathematical Economics",
    "Experimental Economics",
    "Behavioral Economics",
  ],
  "Applied Economics": [
    "Applied Economics",
    "Industrial Organization",
    "Public Economics",
    "Labor Economics",
    "Health Economics",
    "Education Economics",
    "Environmental Economics",
    "Energy Economics",
    "Agricultural Economics",
    "Urban Economics",
    "Regional Economics",
    "Transportation Economics",
    "Tourism Economics",
    "Sports Economics",
    "Cultural Economics",
  ],
  "Finance and Financial Economics": [
    "Financial Economics",
    "Corporate Finance",
    "Banking and Finance",
    "Investment and Portfolio Management",
    "Financial Markets",
    "Financial Econometrics",
    "Insurance Economics",
    "Real Estate Economics",
    "Islamic Finance",
    "International Finance",
  ],
  "International Economics": [
    "International Economics",
    "International Trade",
    "International Finance",
    "Exchange Rate Economics",
    "Open Economy Macroeconomics",
    "Development and Trade",
  ],
  "Development and Growth": [
    "Development Economics",
    "Economic Growth",
    "Poverty and Inequality",
    "Human Development",
    "Rural Development",
    "Emerging Economies",
    "Institutional Development",
  ],
  "Public Policy and Government": [
    "Fiscal Policy",
    "Monetary Policy",
    "Public Finance",
    "Taxation",
    "Cost–Benefit Analysis",
    "Regulatory Economics",
    "Governance and Institutions",
    "Political Economy",
  ],
  "Business and Management Economics": [
    "Managerial Economics",
    "Business Economics",
    "Entrepreneurship Economics",
    "Innovation Economics",
    "Technology and Digital Economy",
    "Industrial Policy",
    "Strategic Economics",
  ],
  "Quantitative and Data-Oriented Fields": [
    "Applied Econometrics",
    "Time Series Analysis",
    "Panel Data Econometrics",
    "Causal Inference",
    "Forecasting",
    "Big Data Economics",
    "Computational Economics",
    "Machine Learning in Economics",
  ],
  "Specialized Fields": [
    "Resource Economics",
    "Natural Resource Economics",
    "Ecological Economics",
    "Climate Economics",
    "Water Economics",
    "Fisheries Economics",
    "Housing Economics",
    "Demographic Economics",
    "Population Economics",
    "Migration Economics",
    "Crime Economics",
    "Law and Economics",
  ],
  "Historical and Philosophical Fields": [
    "Economic History",
    "History of Economic Thought",
    "Philosophy of Economics",
    "Institutional Economics",
    "Austrian Economics",
    "Keynesian Economics",
    "Marxian Economics",
    "Evolutionary Economics",
  ],
  "Interdisciplinary Economics": [
    "Socio-Economics",
    "Economic Sociology",
    "Economic Geography",
    "Economics and Psychology",
    "Economics and Political Science",
    "Economics and Public Health",
    "Economics and Education",
  ],
};
