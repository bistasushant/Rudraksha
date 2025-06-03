"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeroData {
  title: string;
  subtitle: string;
  videoUrl: string;
  images: string[];
}

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hero data
  useEffect(() => {
    async function fetchHeroData() {
      try {
        setLoading(true);
        const response = await fetch("/api/sitesetting/setting/hero");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
          throw new Error(result.message);
        }
        setHeroData(result.data.hero);
      } catch (err) {
        console.error("Error fetching hero data:", err);
        setError(err instanceof Error ? err.message : "Failed to load hero data");
      } finally {
        setLoading(false);
      }
    }

    fetchHeroData();
  }, []);

  // Create slides array from hero data
  const slides = React.useMemo(() => {
    if (!heroData) return [];

    const slidesArray = [];
    // Add video if exists
    if (heroData.videoUrl) {
      slidesArray.push({
        type: "video",
        src: heroData.videoUrl,
      });
    }
    // Add images
    heroData.images.forEach((imageUrl) => {
      slidesArray.push({
        type: "image",
        src: imageUrl,
      });
    });
    return slidesArray;
  }, [heroData]);

  const handleSlideChange = useCallback((index: number) => {
    if (isTransitioning || currentSlide === index) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, currentSlide]);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => {
      handleSlideChange((currentSlide + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide, handleSlideChange, slides.length]);

  if (loading) {
    return (
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </section>
    );
  }

  if (!heroData || slides.length === 0) {
    return (
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="text-white">No hero content available</div>
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Content */}
      <div className="absolute top-0 left-0 w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${currentSlide === index ? "opacity-100" : "opacity-0"
              }`}
          >
            {slide.type === "video" ? (
              <video
                className="w-full h-full object-cover opacity-50"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src={slide.src} type="video/mp4" />
              </video>
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={slide.src}
                  alt={`Slide ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-stone-900/60"></div>
          </div>
        ))}
      </div>

      {/* Content - Only show for first slide */}
      {currentSlide === 0 && (
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
          <div className="text-center animate-from-bottom">
            <h1 className="font-bold lg:leading-normal leading-normal text-4xl lg:text-6xl mb-5 text-white">
              {heroData.title || "Authentic Rudraksha Beads"}
            </h1>
            <p className="text-white/80 text-lg mb-8">
              {heroData.subtitle || "Discover the divine power of genuine Rudraksha beads, sourced directly from Nepal's sacred forests. Experience spiritual growth and positive energy with our authentic collection."}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="relative overflow-hidden py-4 px-8 inline-block font-bold tracking-wider align-middle duration-500 text-lg text-center rounded-xl transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#600000]/50
                bg-gradient-to-r from-[#D4AF37] to-[#8B1A1A] hover:from-[#D4AF37] hover:to-[#8B1A1A] text-white shadow-lg hover:shadow-[#D4AF37]/25 active:scale-95"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons - Only show if there are multiple slides */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideChange(index)}
              className={`w-3 h-3 rounded-full flex items-center justify-center text-white transition-all duration-300 ${currentSlide === index
                  ? "bg-brassGold scale-110"
                  : "bg-white/20 hover:bg-white/30"
                }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}