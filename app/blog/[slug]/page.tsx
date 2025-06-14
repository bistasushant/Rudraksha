// pages/blog/[slug].js
"use client"; // This line is crucial for making it a Client Component

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Import useParams from 'next/navigation' for the pages directory
import Header from "@/components/layout/Header"; // Assuming these components are in your project
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import { ArrowRight, CalendarDays, User } from "lucide-react"; // Import necessary icons
import {
    blogEnglishTexts,
    blogChineseTexts,
    blogHindiTexts,
    blogNepaliTexts,
} from "@/language"; // Assuming these are defined
import { useLanguage } from "@/context/language-context"; // Assuming this context exists
import { motion } from "framer-motion"; // For animations

// Interfaces (copy relevant ones from your main blog list component)
interface IBlogDetail {
    id: string;
    name: string; // Author name
    slug: string;
    heading: string; // Title
    description: string; // This would typically be the full content
    category: { name: string; slug: string; }[]; // Updated to match the populated structure
    image: string;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse<T> {
    error: boolean;
    message: string;
    data: T;
}

// Utility function for consistent date formatting
const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    } catch {
        return "N/A"; // Or handle as appropriate
    }
};

function BlogPostPage() {
    const params = useParams(); // Use useParams instead of useRouter().query
    const slug = params.slug; // Access the slug from params
    const { selectedLanguage } = useLanguage();
    const blogTexts =
        selectedLanguage === "chinese"
            ? blogChineseTexts
            : selectedLanguage === "hindi"
                ? blogHindiTexts
                : selectedLanguage === "nepali"
                    ? blogNepaliTexts
                    : blogEnglishTexts;

    const [post, setPost] = useState<IBlogDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch if slug is available and not undefined
        if (!slug) {
            setLoading(false); // No slug means no data to fetch yet
            return;
        }

        const fetchPost = async () => {
            try {
                setLoading(true);
                setError(null);

                // Use the relative path for client-side fetching to your API route
                // Assuming your API is at /api/blog/[slug]
                const API_URL = `/api/blog/${slug}`;
                console.log(`Fetching individual blog post from: ${API_URL}`);

                const res = await fetch(API_URL);

                if (res.status === 404) {
                    setPost(null);
                    // Optionally, you can redirect to a custom 404 page:
                    // router.replace('/404');
                    return;
                }

                if (!res.ok) {
                    throw new Error(`API call failed with status: ${res.status}`);
                }

                const apiResponse = (await res.json()) as ApiResponse<IBlogDetail>;

                if (apiResponse.error || !apiResponse.data) {
                    throw new Error(apiResponse.message || "Failed to retrieve blog data.");
                }

                // Log the image path for debugging
                console.log('Blog post data:', apiResponse.data);
                console.log('Image path:', apiResponse.data.image);

                setPost(apiResponse.data);
            } catch (err) {
                console.error('Error fetching blog post:', err);
                setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]); // Re-run effect when slug changes

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-ivoryWhite">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400 p-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 p-6 border border-red-500/30"
                    >
                        <p className="text-xl mb-4">errorFetching</p>
                        <p className="text-base text-gray-300">{error}</p>
                        <button
                            onClick={() => window.history.back()} // Go back to the previous page
                            className="mt-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 cursor-pointer text-white text-base px-6 py-3 rounded-full transition-all duration-300 hover:scale-105"
                        >
                            goBack
                        </button>
                    </motion.div>
                </div>
                <Footer />
            </>
        );
    }

    if (!post) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-400 p-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center rounded-xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 border border-yellow-400/20"
                    >
                        <h1 className="text-3xl font-bold mb-4">postNotFound</h1>
                        <p className="text-lg text-gray-300">postNotFoundMsg</p>
                        <button
                            onClick={() => window.location.href = '/blog'}
                            className="mt-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 cursor-pointer text-white text-base px-6 py-3 rounded-full transition-all duration-300 hover:scale-105"
                        >
                            goToBlog
                        </button>
                    </motion.div>
                </div>
                <Footer />
            </>
        );
    }

    const sanitizedContent = DOMPurify.sanitize(post.description);

    return (
        <>
            <Header />
            <section className="bg-gradient-to-br from-[#0f0f0f] via-gray-900 to-[#1a1a1a] py-16 text-ivoryWhite min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 max-w-4xl md:mt-12">
                    <motion.article
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 sm:p-8 lg:p-10 border border-yellow-400/20 shadow-lg"
                    >
                        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden mb-8 flex items-center justify-center bg-gray-800">
                            {post.image ? (
                                <Image
                                    src={post.image}
                                    alt={post.heading}
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    className="object-contain"
                                    onError={(e) => {
                                        console.log('Image error, using fallback for:', post.image);
                                        e.currentTarget.src = "/images/rudrakhsa.png";
                                    }}
                                />
                            ) : (
                                <Image
                                    src="/images/rudrakhsa.png"
                                    alt="Default image"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    className="object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent mb-6 leading-tight">
                            {post.heading}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8">
                            <span className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-yellow-400" />
                                {formatDate(post.createdAt)}
                            </span>
                            <span className="flex items-center gap-2">
                                <User className="h-4 w-4 text-yellow-400" />
                                {post.name || "Unknown Author"}
                            </span>
                            {post.category && post.category.length > 0 && (
                                <span className="flex items-center gap-2">
                                    <span className="inline-block px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-medium">
                                        {post.category.map(cat => typeof cat === 'object' ? cat.name : cat).join(", ")}
                                    </span>
                                </span>
                            )}
                        </div>

                        <div className="prose prose-invert max-w-none text-lg text-gray-300 blog-post-content leading-relaxed">
                            {parse(sanitizedContent)}
                        </div>

                        <motion.button
                            onClick={() => window.history.back()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-12 inline-flex items-center px-6 py-3 border border-yellow-400/40 rounded-full text-yellow-400 bg-transparent hover:bg-yellow-400/10 transition-all duration-300 font-semibold"
                        >
                            <ArrowRight className="h-5 w-5 rotate-180 mr-2" />
                            {blogTexts.backToBlog}
                        </motion.button>
                    </motion.article>
                </div>
            </section>
            <Footer />
        </>
    );
}

export default BlogPostPage;