import JournalHeader from "@/components/JournalHeader";
import Footer from "@/components/Footer";
import { Clock, Bookmark, Share2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";

const Journal = () => {
  const [selectedTopic, setSelectedTopic] = useState("All");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const topics = [
    "All",
    "Macroeconomics",
    "Microeconomics",
    "Policy & Reform",
    "Data Analysis",
    "Behavioral Economics",
    "International Trade",
    "Development Economics",
    "Financial Markets",
    "Public Policy",
    "Research",
  ];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const articles = [
    {
      id: 1,
      title: "Inflation, Expectations, and Everyday Markets in Central Asia",
      excerpt: "TUES economists examine how price expectations are formed in local bazaars, digital marketplaces, and cross‑border trade corridors—and what this means for monetary policy across the region.",
      author: "Dr. Dilshod Karimov",
      authorRole: "Professor of Applied Macroeconomics",
      authorAvatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?auto=format&fit=crop&w=1000&q=80",
      category: "Macroeconomics",
      readTime: 14,
      date: "Mar 15",
      featured: true,
    },
    {
      id: 2,
      title: "Pricing power in small markets: lessons from Termez bazaars",
      excerpt: "A field report on how micro‑entrepreneurs adjust prices daily in response to currency shifts and seasonal demand.",
      author: "N. Yuldasheva",
      authorRole: "Student Research",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1542228262-3d6636a87b29?auto=format&fit=crop&w=800&q=80",
      category: "Microeconomics",
      readTime: 6,
      date: "Mar 12",
      featured: false,
    },
    {
      id: 3,
      title: "Service‑sector reforms and the future of Uzbek cities",
      excerpt: "How coordinated reforms in education, tourism, and public services are reshaping the economic geography of Uzbekistan.",
      author: "Policy Lab at TUES",
      authorRole: "Research Team",
      authorAvatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
      category: "Policy & Reform",
      readTime: 10,
      date: "Mar 10",
      featured: false,
    },
    {
      id: 4,
      title: "Visualizing trade flows along the Termez logistics corridor",
      excerpt: "A visual guide to goods, services, and data moving through one of Central Asia's most dynamic gateways.",
      author: "Applied Statistics Group",
      authorRole: "Data Visualization Team",
      authorAvatar: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=80",
      category: "Data Notebook",
      readTime: 8,
      date: "Mar 8",
      featured: false,
    },
    {
      id: 5,
      title: "Experiments in behavioral finance with TUES undergraduates",
      excerpt: "Students document portfolio‑choice experiments, framing effects, and loss aversion in a controlled lab environment.",
      author: "Student Economics Society",
      authorRole: "Student Research",
      authorAvatar: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
      category: "Workshop Notes",
      readTime: 5,
      date: "Mar 5",
      featured: false,
    },
    {
      id: 6,
      title: "Mapping student entrepreneurship across Termez",
      excerpt: "A data‑driven look at start‑ups, side‑hustles, and service micro‑businesses run by TUES students.",
      author: "Innovation & Start‑up Lab",
      authorRole: "Research Team",
      authorAvatar: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
      category: "Campus Data",
      readTime: 7,
      date: "Mar 3",
      featured: false,
    },
    {
      id: 7,
      title: "Digital transformation in Central Asian banking systems",
      excerpt: "An analysis of how fintech innovations are reshaping traditional banking models across Uzbekistan and neighboring countries.",
      author: "Dr. Alisher Toshmatov",
      authorRole: "Professor of Financial Economics",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
      category: "Financial Markets",
      readTime: 12,
      date: "Mar 1",
      featured: false,
    },
    {
      id: 8,
      title: "Agricultural policy reforms and rural economic development",
      excerpt: "Examining the impact of recent policy changes on agricultural productivity and rural livelihoods in Uzbekistan.",
      author: "Rural Economics Research Group",
      authorRole: "Research Team",
      authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
      category: "Development Economics",
      readTime: 15,
      date: "Feb 28",
      featured: false,
    },
    {
      id: 9,
      title: "Behavioral nudges in public transport pricing",
      excerpt: "A field experiment exploring how small changes in pricing structures can influence commuter behavior and system efficiency.",
      author: "Dr. Malika Karimova",
      authorRole: "Behavioral Economics Lab",
      authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80",
      category: "Behavioral Economics",
      readTime: 7,
      date: "Feb 25",
      featured: false,
    },
    {
      id: 10,
      title: "Student trading labs and digital asset simulations",
      excerpt: "How TUES students use virtual trading platforms to understand market dynamics and develop financial literacy skills.",
      author: "Student Economics Society",
      authorRole: "Student Research",
      authorAvatar: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
      category: "Financial Markets",
      readTime: 9,
      date: "Feb 22",
      featured: false,
    },
    {
      id: 11,
      title: "Tourism, services, and post‑pandemic recovery",
      excerpt: "Analyzing the resilience and transformation of Uzbekistan's tourism sector in the wake of global travel disruptions.",
      author: "Tourism Economics Research Center",
      authorRole: "Research Team",
      authorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80",
      category: "International Trade",
      readTime: 11,
      date: "Feb 20",
      featured: false,
    },
    {
      id: 12,
      title: "Gender gaps in labor market participation: evidence from Central Asia",
      excerpt: "A comprehensive study examining barriers and opportunities for women's economic participation across the region.",
      author: "Dr. Feruza Nasirova",
      authorRole: "Labor Economics Department",
      authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
      category: "Public Policy",
      readTime: 13,
      date: "Feb 18",
      featured: false,
    },
    {
      id: 13,
      title: "Climate change adaptation strategies for Central Asian economies",
      excerpt: "Exploring economic policies and market mechanisms to address climate risks in water-scarce regions.",
      author: "Environmental Economics Group",
      authorRole: "Research Team",
      authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
      category: "Development Economics",
      readTime: 16,
      date: "Feb 15",
      featured: false,
    },
    {
      id: 14,
      title: "E-commerce growth and traditional retail transformation",
      excerpt: "How digital marketplaces are reshaping consumer behavior and business models in Uzbekistan's retail sector.",
      author: "Digital Economy Research Lab",
      authorRole: "Research Team",
      authorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
      category: "Microeconomics",
      readTime: 10,
      date: "Feb 12",
      featured: false,
    },
    {
      id: 15,
      title: "Monetary policy transmission mechanisms in emerging markets",
      excerpt: "Investigating how central bank policies affect real economic outcomes in small open economies.",
      author: "Dr. Shavkat Mirziyoyev",
      authorRole: "Monetary Policy Research",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
      category: "Macroeconomics",
      readTime: 14,
      date: "Feb 10",
      featured: false,
    },
  ];

  const featuredArticle = articles.find((a) => a.featured);
  const regularArticles = articles.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-white">
      <JournalHeader />

      <main className="pt-24 pb-16">
        {/* Hero Section - Medium Style */}
        <section className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
                TUES Economics Journal
              </h1>
              <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Research, commentary, and analysis from economists, scholars, and policy thinkers
              </p>
            </div>
          </div>
        </section>

        {/* Topic Filter Bar - Medium Style */}
        <section className="border-b border-gray-200 bg-white sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative flex items-center">
              {/* Scroll Left Button */}
              <button
                onClick={scrollLeft}
                className="absolute left-0 z-10 bg-white/80 backdrop-blur-sm p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              {/* Scrollable Topics */}
              <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 px-8"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {/* Explore Topics Button */}
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    height="20"
                    width="20"
                    className="text-gray-600"
                  >
                    <circle cx="12" cy="12.001" r="10.5" stroke="currentColor"></circle>
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="m16.083 6.167-.147.989-.984 6.636-.036.247-.22.119-5.899 3.194-.88.476.147-.989.984-6.635.037-.248.22-.119 5.899-3.194zM9.92 11.15 9.2 15.997l4.308-2.333zm4.163 1.695-3.59-2.514L14.8 8z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Explore topics</span>
                </button>

                {/* Topic Buttons */}
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      selectedTopic === topic
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Scroll Right Button */}
              <button
                onClick={scrollRight}
                className="absolute right-0 z-10 bg-white/80 backdrop-blur-sm p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredArticle && (
          <section className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="max-w-4xl mx-auto">
                <article className="cursor-pointer group">
                  <div className="mb-6">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-[400px] object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={featuredArticle.authorAvatar}
                          alt={featuredArticle.author}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {featuredArticle.author}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-600">{featuredArticle.date}</span>
                      <span className="text-gray-400">·</span>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{featuredArticle.readTime} min read</span>
                      </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {featuredArticle.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <Bookmark className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <Share2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>
        )}

        {/* Articles Grid - Medium Style */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Articles Column */}
              <div className="lg:col-span-2 space-y-8">
                {regularArticles.map((article) => (
                  <article
                    key={article.id}
                    className="cursor-pointer group border-b border-gray-200 pb-8 last:border-0"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={article.authorAvatar}
                            alt={article.author}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-sm text-gray-600">{article.author}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-sm text-gray-500">{article.date}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-gray-700 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-3 leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {article.category}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{article.readTime} min</span>
                            </div>
                          </div>
                          <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                            <Bookmark className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-32 h-32 md:w-40 md:h-40 object-cover rounded"
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="sticky top-24 space-y-8">
                  {/* Discover More */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                      Discover more
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 cursor-pointer group">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">
                            Behavioral nudges in public transport pricing
                          </p>
                          <p className="text-xs text-gray-500 mt-1">7 min read</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 cursor-pointer group">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">
                            Student trading labs and digital asset simulations
                          </p>
                          <p className="text-xs text-gray-500 mt-1">9 min read</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 cursor-pointer group">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">
                            Tourism, services, and post‑pandemic recovery
                          </p>
                          <p className="text-xs text-gray-500 mt-1">11 min read</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call for Papers */}
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                      Call for Papers
                    </h3>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Special Issue: Service Economies in a Digital World
                    </h4>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      TUES Economics Journal invites submissions on topics including digital platforms, gig work,
                      tourism, and education services.
                    </p>
                    <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                      Submit your manuscript
                    </button>
                  </div>

                  {/* Author Spotlight */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                      Author Spotlight
                    </h3>
                    <div className="flex items-start gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80"
                        alt="Dr. Dilshod Karimov"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Research Chair</p>
                        <p className="text-sm font-bold text-gray-900">Dr. Dilshod Karimov</p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Connecting macroeconomic models with on‑the‑ground evidence from border regions and logistics hubs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Latest Research - Magazine Style Layout */}
        <section className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Latest Research</h2>
              <p className="text-gray-600">Recent publications and working papers from our research teams</p>
            </div>

            <div className="grid md:grid-cols-12 gap-6">
              {/* Large Featured Card - Left Side */}
              <article className="md:col-span-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden text-white cursor-pointer group hover:shadow-2xl transition-all duration-300">
                <div className="relative h-96">
                  <img
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80"
                    alt="Research"
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        Macroeconomics
                      </span>
                      <span className="text-white/70 text-sm">March 2025</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-3 group-hover:text-blue-300 transition-colors">
                      Central Bank Digital Currencies: Opportunities for Central Asia
                    </h3>
                    <p className="text-white/90 text-lg leading-relaxed mb-4">
                      A comprehensive analysis of CBDC implementation strategies and their potential impact on monetary policy and financial inclusion across the region.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                          alt="Author"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-white/90">Dr. Shavkat Mirziyoyev</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/70 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>18 min read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              {/* Right Side - Stacked Cards */}
              <div className="md:col-span-4 space-y-6">
                {/* Card 1 */}
                <article className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=200&q=80"
                        alt="Article"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-blue-600 font-medium">E-commerce</span>
                      <h4 className="text-base font-bold text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        Digital Payment Adoption in Rural Markets
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>8 min</span>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Card 2 */}
                <article className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=200&q=80"
                        alt="Article"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-green-600 font-medium">Environment</span>
                      <h4 className="text-base font-bold text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                        Green Finance Mechanisms for Climate Adaptation
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>12 min</span>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Card 3 */}
                <article className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=80"
                        alt="Article"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-purple-600 font-medium">Policy</span>
                      <h4 className="text-base font-bold text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        Labor Market Reforms and Gender Equality
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>15 min</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Bottom Row - Horizontal Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <article className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"
                    alt="Article"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                      Trade
                    </span>
                    <span className="text-xs text-gray-500">Feb 28</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                    Cross-Border E-Commerce and Regional Integration
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    Analyzing how digital trade platforms are connecting Central Asian markets.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>10 min read</span>
                  </div>
                </div>
              </article>

              <article className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
                    alt="Article"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Finance
                    </span>
                    <span className="text-xs text-gray-500">Feb 25</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    Microfinance and Small Business Growth
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    Case studies from Uzbekistan's microfinance sector and entrepreneurial development.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>9 min read</span>
                  </div>
                </div>
              </article>

              <article className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
                    alt="Article"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                      Data
                    </span>
                    <span className="text-xs text-gray-500">Feb 22</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    Big Data Analytics in Economic Forecasting
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    Leveraging machine learning and big data for improved economic predictions.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>11 min read</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Journal;
