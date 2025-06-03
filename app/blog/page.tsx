"use client";
import './blog-global.css';

import { useState, useEffect, Suspense } from "react";
import { CalendarDays, User, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { useDebounce } from "@/hooks/useDebounce";
import {
  blogEnglishTexts,
  blogChineseTexts,
  blogHindiTexts,
  blogNepaliTexts,
} from "@/language";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import { ApiResponse } from '@/types';

// Utility function for consistent date formatting
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return new Date().toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }
};

interface IBlog {
  id: string;
  name: string;
  slug: string;
  heading: string;
  description: string;
  category: string[];
  image: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  slug: string;
}

interface BlogListData {
  blogs: IBlog[];
  total: number;
  page: number;
  totalPages: number;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// Reusable Card Component for Sidebar
function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-300 shadow-lg hover:shadow-yellow-400/20"
    >
      <h3 className="mb-4 text-xl font-bold text-ivoryWhite bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

// Blog Post Card Component
function BlogPostCard({
  post,
  isExpanded,
  toggleExpand,
}: {
  post: BlogPost;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
}) {
  const router = useRouter();
  const plainExcerpt = DOMPurify.sanitize(post.excerpt, { ALLOWED_TAGS: [] });
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-300 shadow-lg hover:shadow-yellow-400/20 w-full"
    >
      <div className="flex flex-col sm:flex-row gap-4 p-6">
        <div className="relative w-full sm:w-24 sm:h-24 aspect-square flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, 96px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => (e.currentTarget.src = "/images/rudrakhsa.png")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {post.author}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors duration-300">
            {post.title}
          </h3>
          <div className="text-gray-300 text-sm mb-3">
            {isExpanded ? parse(plainExcerpt) : <p className="line-clamp-3">{plainExcerpt}</p>}
          </div>
          <Button
            onClick={() => isExpanded ? toggleExpand(post.id) : router.push(`/blog/${post.slug}`)}
            size="sm"
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 cursor-pointer text-white text-xs px-4 py-2 rounded-full transition-all duration-300 hover:scale-105"
            aria-label={isExpanded ? "Collapse post" : "Read full post"}
          >
            {isExpanded ? "Less" : "Read More"}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function BlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const blogTexts =
    selectedLanguage === "chinese"
      ? blogChineseTexts
      : selectedLanguage === "hindi"
        ? blogHindiTexts
        : selectedLanguage === "nepali"
          ? blogNepaliTexts
          : blogEnglishTexts;

  // Add mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("category", categoryId);
      params.set("page", "1");
    } else {
      params.delete("category");
    }
    router.push(`?${params.toString()}`);
  };

  // Update query params when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchQuery) {
      params.set("query", debouncedSearchQuery);
      params.set("page", "1");
    } else {
      params.delete("query");
    }
    router.push(`?${params.toString()}`);
  }, [debouncedSearchQuery, router, searchParams]);

  // Update query params
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || null;
    setCurrentPage(Math.max(1, page));
    setSearchQuery(query);
    setSelectedCategory(category);
  }, [searchParams]);

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", "3");
        if (debouncedSearchQuery) params.set("query", debouncedSearchQuery);
        if (selectedCategory) params.set("category", selectedCategory);

        const response = await fetch(`/api/blog?${params.toString()}`);
        if (!response.ok) throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
        const data = (await response.json()) as ApiResponse<BlogListData>;
        if (data.error || !data.data || !Array.isArray(data.data.blogs)) {
          throw new Error("Received invalid data format from API.");
        }
        const postsArray: BlogPost[] = data.data.blogs.map((blog: IBlog) => ({
          id: blog.id,
          title: blog.heading || "Untitled",
          excerpt: blog.description || "No description available",
          date: formatDate(blog.createdAt),
          author: blog.name || "Unknown Author",
          image: blog.image || "/images/rudrakhsa.png",
          slug: blog.slug
        }));
        setBlogPosts(postsArray);
        setTotalPages(data.data.totalPages);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch blog posts");
      } finally {
        setLoading(false);
      }
    };
    fetchBlogPosts();
  }, [currentPage, debouncedSearchQuery, selectedCategory]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const response = await fetch("/api/blogcategory");
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.statusText}`);
        const data = (await response.json()) as ApiResponse<{
          blogCategories: BlogCategory[];
          total: number;
          page: number;
          totalPages: number;
        }>;
        if (!data.error && data.data?.blogCategories) {
          setCategories(data.data.blogCategories);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error("Error fetching blog categories:", err);
        setCategoriesError(err instanceof Error ? err.message : "Failed to fetch categories");
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <Header />
      <section className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <div
          className="relative min-h-[600px] max-h-[80vh] w-full overflow-hidden bg-gray-900 flex items-center justify-center"
          style={{
            background: `
              linear-gradient(135deg, rgba(139, 26, 26, 0.9) 0%, rgba(212, 175, 55, 0.7) 50%, rgba(28, 28, 28, 0.9) 100%),
              url(/images/Bestback.png)
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30" />
          {mounted && (
            <div className="absolute inset-0">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-30"
                  animate={{
                    y: [0, -100, 0],
                    x: [0, Math.random() * 100 - 50, 0],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 6 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          )}
          <div className="container relative z-10 mx-auto flex flex-col items-center justify-center h-full px-4 sm:px-6 text-center text-white">
            {mounted ? (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mb-6 text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent leading-tight"
                >
                  {blogTexts.h1}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mb-8 max-w-2xl text-base sm:text-lg md:text-xl text-[#F5F5DC]/90 font-light leading-relaxed"
                >
                  {blogTexts.h2}
                </motion.p>
                <motion.form
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="relative w-full max-w-md"
                >
                  <label htmlFor="search" className="sr-only">
                    Search blog posts
                  </label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Discover ancient wisdom..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:bg-white/20 transition-all duration-300 text-base shadow-lg"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-yellow-400" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-lg -z-10" />
                </motion.form>
              </>
            ) : (
              <>
                <h1 className="mb-6 text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent leading-tight">
                  {blogTexts.h1}
                </h1>
                <p className="mb-8 max-w-2xl text-base sm:text-lg md:text-xl text-[#F5F5DC]/90 font-light leading-relaxed">
                  {blogTexts.h2}
                </p>
                <form className="relative w-full max-w-md">
                  <label htmlFor="search" className="sr-only">
                    Search blog posts
                  </label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Discover ancient wisdom..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:bg-white/20 transition-all duration-300 text-base shadow-lg"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-yellow-400" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-lg -z-10" />
                </form>
              </>
            )}
          </div>
          {mounted && (
            <motion.div
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Blog Content */}
        <div className="bg-gradient-to-br from-[#0f0f0f] via-gray-900 to-[#1a1a1a] py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-8 md:col-span-2 lg:col-span-3">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400" />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 p-6 border border-red-500/30 text-center"
                  >
                    <p className="text-red-400 text-base mb-4">{error}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105"
                      aria-label="Retry loading blog posts"
                    >
                      Try Again
                    </Button>
                  </motion.div>
                ) : blogPosts.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-xl text-yellow-400">No blog posts found</p>
                  </div>
                ) : (
                  blogPosts.map((post) => (
                    <BlogPostCard
                      key={post.id}
                      post={post}
                      isExpanded={expandedPostId === post.id}
                      toggleExpand={(id) =>
                        setExpandedPostId(expandedPostId === id ? null : id)
                      }
                    />
                  ))
                )}
                {!loading && !error && totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center gap-2 mt-12 flex-wrap"
                  >
                    {Array.from({ length: totalPages }, (_, index) => (
                      <Button
                        key={`page-${index + 1}`}
                        className={`w-12 h-12 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${currentPage === index + 1
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 shadow-lg shadow-yellow-500/30"
                          : "bg-white/10 backdrop-blur-sm text-ivoryWhite hover:bg-white/20 border border-white/20"
                          }`}
                        onClick={() => handlePageChange(index + 1)}
                        aria-label={`Go to page ${index + 1}`}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </div>
              <div className="space-y-8 md:col-span-1">
                {/* Categories */}
                <SidebarCard title={blogTexts.categories}>
                  {categoriesLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-yellow-400" />
                      <p className="text-gray-400">Loading categories...</p>
                    </div>
                  ) : categoriesError ? (
                    <div className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                      <p className="mb-2">{categoriesError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-yellow-400 hover:underline font-medium"
                        aria-label="Reload categories"
                      >
                        Reload
                      </button>
                    </div>
                  ) : categories.length === 0 ? (
                    <p className="text-yellow-400 bg-red-500/10 p-4 rounded-xl">
                      No categories found
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      <motion.li
                        whileHover={{ x: 8 }}
                        className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300 ${!selectedCategory
                          ? "bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-400 font-semibold"
                          : "text-[#F5F5DC]/70 hover:text-ivoryWhite hover:bg-white/5"
                          }`}
                        onClick={() => handleCategorySelect(null)}
                        role="button"
                        aria-label="View all categories"
                      >
                        <ArrowRight className="h-4 w-4" />
                        All Categories
                      </motion.li>
                      {categories.map((category) => (
                        <motion.li
                          key={category.id}
                          whileHover={{ x: 8 }}
                          className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300 ${selectedCategory === category.id
                            ? "bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-400 font-semibold"
                            : "text-[#F5F5DC]/70 hover:text-ivoryWhite hover:bg-white/5"
                            }`}
                          onClick={() => handleCategorySelect(category.id)}
                          role="button"
                          aria-label={`Filter by ${category.name}`}
                        >
                          <ArrowRight className="h-4 w-4" />
                          {category.name}
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </SidebarCard>
                {/* Recent Posts */}
                {!loading && !error && blogPosts.length > 0 && (
                  <SidebarCard title={blogTexts.h4}>
                    <div className="space-y-4">
                      {blogPosts.slice(0, 3).map((post) => (
                        <motion.div
                          key={`recent-${post.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          whileHover={{ scale: 1.02 }}
                          className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer"
                        >
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              sizes="64px"
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => (e.currentTarget.src = "/images/rudrakhsa.png")}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-ivoryWhite group-hover:text-yellow-400 transition-colors duration-300 line-clamp-2 leading-tight text-sm">
                              {post.title}
                            </h4>
                            <p className="text-xs text-[#F5F5DC]/60 mt-1 flex items-center gap-2">
                              <CalendarDays className="h-3 w-3" />
                              {post.date}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </SidebarCard>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default function Blog() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-gray-900">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-400" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <BlogContent />
    </Suspense>
  );
}