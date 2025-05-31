"use client";
import './blog-global.css';

import { useState, useEffect, Suspense } from "react";
import { CalendarDays, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/language-context";
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
}

interface ApiResponse<T> {
  error: boolean;
  message: string;
  data: T;
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

// Utility to truncate text
// const truncateText = (text: string, maxLength: number): string => {
//   if (text.length <= maxLength) return text;
//   return text.substring(0, maxLength) + "...";
// };

function BlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedLanguage } = useLanguage();

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const blogTexts =
    selectedLanguage === "chinese"
      ? blogChineseTexts
      : selectedLanguage === "hindi"
        ? blogHindiTexts
        : selectedLanguage === "nepali"
          ? blogNepaliTexts
          : blogEnglishTexts;

  // Sanitize and render HTML content
  const renderHTMLContent = (html: string) => {
    const sanitizedHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "ol", "ul", "li", "strong", "em", "img", "br"],
      ALLOWED_ATTR: ["src", "alt", "class"],
    });
    return parse(sanitizedHTML);
  };

  // Extract plain text from HTML
  const getPlainText = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = DOMPurify.sanitize(html);
    return div.textContent || div.innerText || "";
  };

  // Update currentPage, searchQuery, and selectedCategory from query params
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 3);
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || null;
    setCurrentPage(Math.max(1, page));
    setSearchQuery(query);
    setSelectedCategory(category);
  }, [searchParams]);

  // Fetch blog posts with pagination, search, and category filtering
  useEffect(() => {
    const fetchBlogPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", "3");
        if (searchQuery) params.set("query", searchQuery);
        if (selectedCategory) params.set("category", selectedCategory);

        const response = await fetch(`/api/blog?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
        }
        const data = (await response.json()) as ApiResponse<BlogListData>;
        if (data.error || !data.data || !Array.isArray(data.data.blogs)) {
          throw new Error("Received invalid data format from API.");
        }
        const postsArray: BlogPost[] = data.data.blogs.map((blog: IBlog) => ({
          id: blog.id,
          title: blog.heading || "Untitled",
          excerpt: blog.description || "No description available",
          date: blog.createdAt
            ? new Date(blog.createdAt).toLocaleDateString("en-CA")
            : new Date().toLocaleDateString("en-CA"),
          author: blog.name || "Unknown Author",
          image: blog.image || "/images/rudrakhsa.png",
        }));
        setBlogPosts(postsArray);
        setTotalPages(data.data.totalPages);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch blog posts"
        );
        setBlogPosts(getFallbackBlogPosts());
      } finally {
        setLoading(false);
      }
    };
    fetchBlogPosts();
  }, [currentPage, searchQuery, selectedCategory]);

  // Fetch blog categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const response = await fetch("/api/blogcategory");
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        const data = (await response.json()) as ApiResponse<{
          blogCategories: BlogCategory[];
          total: number;
          page: number;
          totalPages: number;
        }>;
        if (!data.error && data.data?.blogCategories) {
          setCategories(data.data.blogCategories);
        } else {
          console.warn("Invalid category API response format.");
          setCategories(getFallbackCategories());
        }
      } catch (err) {
        console.error("Error fetching blog categories:", err);
        setCategoriesError(
          err instanceof Error ? err.message : "Failed to fetch categories"
        );
        setCategories(getFallbackCategories());
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fallback data for blog posts
  const getFallbackBlogPosts = (): BlogPost[] => [
    {
      id: "1",
      title: "The Spiritual Significance of Rudraksha",
      excerpt:
        "Rudraksha, the sacred seed of the Rudraksha tree, holds immense spiritual significance...",
      date: "2024-03-15",
      author: "Spiritual Guide",
      image: "/images/rudrakhsa.png",
    },
    {
      id: "2",
      title: "Choosing the Right Rudraksha for You",
      excerpt:
        "Choosing the right Rudraksha bead can be a deeply personal journey...",
      date: "2024-03-12",
      author: "Ayurvedic Expert",
      image: "/images/rudrakhsa.png",
    },
  ];

  // Fallback data for categories
  const getFallbackCategories = (): BlogCategory[] => [
    {
      id: "1",
      name: "Spiritual Growth",
      slug: "spiritual-growth",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Meditation",
      slug: "meditation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Ayurveda",
      slug: "ayurveda",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Ancient Wisdom",
      slug: "ancient-wisdom",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

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

  return (
    <>
      <Header />
      <section className="flex flex-col">
        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/Bestback.png"
              alt={blogTexts.h1}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
            <h1 className="mb-6 text-4xl text-ivoryWhite font-bold md:text-5xl lg:text-6xl">
              {blogTexts.h1}
            </h1>
            <p className="mb-8 max-w-2xl text-[#F5F5DC]/70 text-lg md:text-xl">{blogTexts.h2}</p>
          </div>
        </div>
        {/* Blog Content */}
        <div className="bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="space-y-8 lg:col-span-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brassGold"></div>
                  </div>
                ) : error ? (
                  <div className="rounded-lg bg-red-50 p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : blogPosts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-lg text-brassGold">No blog posts found</p>
                  </div>
                ) : (
                  blogPosts.map((post) => {
                    const isExpanded = expandedPostId === post.id;
                    const plainExcerpt = getPlainText(post.excerpt);
                    // const displayText = isExpanded
                    //   ? post.excerpt
                    //   : truncateText(plainExcerpt, 200);

                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="overflow-hidden rounded-xl bg-deepGraphite border border-[#B87333]/30 hover:border-[#B87333] transition-colors"
                      >
                        <div
                          className="relative h-64">
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 66vw"
                            className="object-cover"
                            onError={(e) =>
                              (e.currentTarget.src = "/images/rudrakhsa.png")
                            }
                          />
                        </div>
                        <div

                          className="p-8">
                          <div className="mb-4 flex items-center gap-4 text-[#F5F5DC]/70">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-5 w-5" />
                              <span>{post.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              <span>{post.author}</span>
                            </div>
                          </div>
                          <h2 className="mb-4 text-ivoryWhite text-2xl font-bold">
                            {post.title}
                          </h2>
                          <div className="blog-description mb-6 text-[#F5F5DC]/70 text-justify"
                          >
                            {isExpanded
                              ? renderHTMLContent(post.excerpt)
                              : plainExcerpt}
                          </div>
                          <Button
                            onClick={() =>
                              setExpandedPostId(isExpanded ? null : post.id)
                            }
                            className="flex items-center bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                          >
                            {isExpanded ? "Read Less" : "Read More"}
                            <ArrowRight
                              className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""
                                }`}
                            />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                {/* Pagination */}
                {!loading && !error && totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <Button
                        key={index + 1}
                        variant="outline"
                        className={`rounded-full ${currentPage === index + 1 ? "bg-brassGold" : "bg-ivoryWhite"
                          }`}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {/* Sidebar */}
              <div className="space-y-8">

                {/* Categories */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="rounded-xl bg-deepGraphite p-6 border border-[#B87333]/30 hover:border-[#B87333] transition-colors">
                  <h3 className="mb-4 text-ivoryWhite text-xl font-bold">
                    {blogTexts.categories}
                  </h3>
                  {categoriesLoading ? (
                    <p className="text-sm text-antiqueCopper">
                      Loading categories...
                    </p>
                  ) : categoriesError ? (
                    <div className="text-sm text-red-400">
                      <p>{categoriesError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-antiqueCopper hover:underline"
                      >
                        Reload
                      </button>
                    </div>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-himalayanRed">No categories found</p>
                  ) : (
                    <ul className="space-y-2">
                      <li
                        className={`flex items-center gap-2 hover:text-ivoryWhite cursor-pointer ${!selectedCategory ? "text-[#F5F5DC]/70 font-semibold" : "text-[#F5F5DC]/50"
                          }`}
                        onClick={() => handleCategorySelect(null)}
                      >
                        <ArrowRight className="h-4 w-4" />
                        All Categories
                      </li>
                      {categories.map((category) => (
                        <li
                          key={category.id}
                          className={`flex items-center gap-2 hover:text-ivoryWhite cursor-pointer ${selectedCategory === category.id
                            ? "text-[#F5F5DC]/70 font-semibold"
                            : "text-[#F5F5DC]/50"
                            }`}
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          <ArrowRight className="h-4 w-4" />
                          {category.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
                {/* Recent Posts */}
                {!loading && !error && blogPosts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="rounded-xl bg-deepGraphite p-6 border border-[#B87333]/30 hover:border-[#B87333] transition-colors">
                    <h3 className="mb-4 text-xl font-bold text-ivoryWhite">{blogTexts.h4}</h3>
                    <div className="space-y-4">
                      {blogPosts.slice(0, 3).map((post) => (
                        <div key={post.id} className="flex items-center gap-4">
                          <div className="relative h-16 w-16 flex-shrink-0">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              sizes="64px"
                              className="rounded-lg object-cover"
                              onError={(e) =>
                                (e.currentTarget.src = "/images/rudrakhsa.png")
                              }
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-ivoryWhite hover:text-brassGold cursor-pointer">
                              {post.title}
                            </h4>
                            <p className="text-sm text-ivoryWhite">{post.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
        </div>
      }
    >
      <BlogContent />
    </Suspense>
  );
}
