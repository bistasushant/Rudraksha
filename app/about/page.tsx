"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Leaf,
  Target,
  History,
  Users,
  Gem,
  Heart,
  HandHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";
import {
  aboutEnglishTexts,
  aboutChineseTexts,
  aboutHindiTexts,
  aboutNepaliTexts,
} from "@/language";
import Header from "@/components/layout/Header";
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";

interface Value {
  title: string;
  description: string;
}

interface AboutDetails {
  title?: string;
  description?: string;
  imageUrl?: string;
  heroTitle?: string;
  heroDescription?: string;
  missionTitle?: string;
  missionDescription?: string;
  values?: Value[];
  storyTitle?: string;
  storyDescription?: string;
}

export default function About() {
  const { selectedLanguage } = useLanguage();
  const [aboutDetails, setAboutDetails] = useState<AboutDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAboutDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/sitesetting/about");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch about details: ${response.statusText}`
          );
        }
        const data = await response.json();
        if (data?.data) {
          setAboutDetails({
            title: data.data.title,
            description: data.data.description,
            imageUrl: data.data.imageUrl,
            heroTitle: data.data.heroTitle,
            heroDescription: data.data.heroDescription,
            missionTitle: data.data.missionTitle,
            missionDescription: data.data.missionDescription,
            values: Array.isArray(data.data.values) ? data.data.values : [],
            storyTitle: data.data.storyTitle,
            storyDescription: data.data.storyDescription,
          });
        } else {
          console.warn("No about details data found in API response");
          setAboutDetails({});
        }
      } catch (err) {
        console.error("Error fetching about details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch about details"
        );
        setAboutDetails({});
      } finally {
        setLoading(false);
      }
    };
    fetchAboutDetails();
  }, []);

  const renderHTMLContent = (html: string) => {
    const sanitizedHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "ol", "ul", "li", "strong", "em", "img", "br"],
      ALLOWED_ATTR: ["src", "alt", "class"],
    });
    return parse(sanitizedHTML);
  };

  const aboutTexts =
    selectedLanguage === "chinese"
      ? aboutChineseTexts
      : selectedLanguage === "hindi"
        ? aboutHindiTexts
        : selectedLanguage === "nepali"
          ? aboutNepaliTexts
          : aboutEnglishTexts;

  const heroTitle = aboutDetails?.heroTitle || aboutTexts.h1;
  const heroDescription = aboutDetails?.heroDescription || aboutTexts.h2;
  const missionTitle =
    aboutDetails?.missionTitle || aboutDetails?.title || aboutTexts.h1;
  const missionDescription =
    aboutDetails?.missionDescription ||
    aboutDetails?.description ||
    aboutTexts.h2;
  const values =
    aboutDetails?.values && aboutDetails.values.length > 0
      ? aboutDetails.values
      : [
        { title: aboutTexts.authenticity, description: aboutTexts.h7 },
        { title: aboutTexts.integrity, description: aboutTexts.h8 },
        { title: aboutTexts.community, description: aboutTexts.h9 },
        { title: aboutTexts.spirituality, description: aboutTexts.h14 },
        { title: aboutTexts.customerCentricity, description: aboutTexts.h15 },
        { title: aboutTexts.sustainability, description: aboutTexts.h16 },
      ];
  const storyTitle = aboutDetails?.storyTitle || aboutTexts.h10;

  const storyParagraphs =
    aboutDetails?.storyDescription
      ? aboutDetails.storyDescription
        .split("\n")
        .filter((p) => p.trim().length > 0)
      : [aboutTexts.h11, aboutTexts.h12, aboutTexts.h13];

  const imageUrl = aboutDetails?.imageUrl || "/images/mission-image.png";

  const valueIcons = [
    Gem,
    Target,
    Users,
    HandHeart,
    Heart,
    Leaf,
    Gem,
  ];

  return (
    <>
      <Header />
      <section className="flex flex-col">
        {/* Responsive improvements applied below */}

        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/spiritual.png"
              alt={heroTitle}
              fill
              priority
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            ) : error ? (
              <div className="space-y-4">
                <p className="text-red-300">Error: {error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <h1 className="mb-6 text-3xl sm:text-4xl text-ivoryWhite md:text-5xl lg:text-6xl font-bold">
                  {heroTitle}
                </h1>
                <div className="mb-8 max-w-2xl text-[#F5F5DC]/70 text-base sm:text-lg md:text-xl">
                  {heroDescription
                    ? renderHTMLContent(heroDescription)
                    : "No description available."}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Mission Section */}
        {!loading && !error && (
          <div className="bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] py-16">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: 0.2
                }}
                className="grid items-center gap-12 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-8 w-8 text-antiqueCopper text-primary" />
                    <h2 className="text-3xl text-brassGold font-bold">{missionTitle}</h2>
                  </div>
                  <div className="about-description text-lg text-[#F5F5DC]/70 text-justify">
                    {missionDescription
                      ? renderHTMLContent(missionDescription)
                      : "No mission description available."}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="bg-charcoalBlack border-[#B87333] text-white hover:text-white font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    <Link href="/shop">{aboutTexts.h5}</Link>
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="relative h-64 md:h-96 rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={missionTitle}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = "/images/mission-image.png")
                    }
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Values Section */}
        {!loading && !error && (
          <div className="py-16 bg-[#2A2A2A]/90">
            <div className="container mx-auto px-4">
              <h2 className="mb-12 text-center text-3xl text-brassGold font-bold">
                {aboutTexts.h6}
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {values.map((value, index) => {
                  const Icon =
                    valueIcons[index] || valueIcons[valueIcons.length - 1];
                  return (
                    <motion.div
                      key={value.title || index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="flex flex-col items-center p-6 bg-deepGraphite border border-[#B87333]/30 hover:border-[#B87333] rounded-lg shadow-md text-center hover:shadow-lg transition-colors"
                    >
                      <div className="h-12 w-12 rounded-full bg-antiqueCopper flex items-center justify-center flex-shrink-0">
                        <Icon size={28} className="text-ivoryWhite" />
                      </div>
                      <h3 className="text-xl text-ivoryWhite font-bold mb-2">{value.title}</h3>
                      <div className="text-[#F5F5DC]/70">
                        {value.description
                          ? renderHTMLContent(value.description)
                          : "No description available."}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Story Section (now dynamic from backend) */}
        {!loading && !error && (
          <div className="bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-4 mb-8 md:mb-12 justify-center md:justify-start">
                <History className="h-8 w-8 text-ivoryWhite" />
                <h2 className="text-3xl font-bold text-brassGold">{storyTitle}</h2>
              </div>
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div className="space-y-4 md:order-2">
                  {storyParagraphs.map((paragraph, index) => (
                    <div key={index} className="text-lg text-[#F5F5DC]/70">
                      {renderHTMLContent(paragraph)}
                    </div>
                  ))}
                </div>
                <div className="relative h-80 md:h-96 rounded-lg overflow-hidden md:order-1">
                  <Image
                    src="/images/Story-of-Rudraksha.jpg"
                    alt={storyTitle}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = "/images/Story-of-Rudraksha.jpg")
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}