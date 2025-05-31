"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import Image from "next/image";


export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slides = [
    {
      type: "video",
      src: "/videos/modern.mp4",
    },
    {
      type: "image",
      src: "/images/Bestback.png",
    },
    {
      type: "image",
      src: "/images/rudrakhsa.png",
    },
    {
      type: "image",
      src: "/images/spiritual.png",
    },
    {
      type: "image",
      src: "/images/Story-of-Rudraksha.jpg",
    },
  ];

  const handleSlideChange = useCallback((index: number) => {
    if (isTransitioning || currentSlide === index) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, currentSlide]);
  useEffect(() => {
    const interval = setInterval(() => {
      handleSlideChange((currentSlide + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide, handleSlideChange, slides.length]);
  // Fetch settings data from the API
  // useEffect(() => {
  //   async function fetchSettings() {
  //     try {
  //       setLoading(true);
  //       const response = await fetch("/api/sitesetting/setting", {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //         },
  //       });

  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }

  //       const result: ApiResponse<HeroData> = await response.json();

  //       if (result.error || !result.data) {
  //         throw new Error(result.message || "Failed to fetch settings");
  //       }

  //       setHeroData(result.data);
  //     } catch (err) {
  //       console.error("Fetch Settings Error:", err);
  //       setError(err instanceof Error ? err.message : "Unknown error");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   fetchSettings();
  // }, [token]);

  // Framer Motion variants for the glowing border animation
  // const borderVariants = {
  //   animate: {
  //     background: [
  //       "linear-gradient(90deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
  //       "linear-gradient(180deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
  //       "linear-gradient(270deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
  //       "linear-gradient(360deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
  //       "linear-gradient(90deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
  //     ],
  //     boxShadow: [
  //       "0 0 10px rgba(245, 232, 199, 0.8), 0 0 20px rgba(212, 175, 55, 0.5)",
  //       "0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(255, 255, 255, 0.5)",
  //       "0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(245, 232, 199, 0.5)",
  //     ],
  //     transition: {
  //       duration: 4,
  //       ease: "linear",
  //       repeat: Infinity,
  //       repeatType: "loop" as const,
  //     },
  //   },
  // };

  // // Determine which data to display: API data or fallback
  // const displayData = {
  //   title: heroData?.hero?.title || heroTexts.h1,
  //   subtitle: heroData?.hero?.subtitle || heroTexts.h2,
  //   videoUrl: heroData?.hero?.videoUrl || "/videos/videoforsite.mp4",
  // };

  return (
    // <section className="flex flex-col">
    //   <div className="relative h-[80vh] w-full overflow-hidden z-0">
    //     <div className="absolute inset-0">
    //       {loading ? (
    //         <div className="absolute inset-0 flex items-center justify-center">
    //           <p className="text-white">Loading...</p>
    //         </div>
    //       ) : error ? (
    //         <div className="absolute inset-0 flex items-center justify-center">
    //           <p className="text-red-500">{error}</p>
    //         </div>
    //       ) : (
    //         <video
    //           className="absolute inset-0 w-full h-full object-cover"
    //           autoPlay
    //           muted
    //           loop
    //         >
    //           <source src={displayData.videoUrl} type="video/mp4" />
    //           {heroTexts.videotext}
    //         </video>
    //       )}
    //       <div className="absolute inset-0 bg-black/60" />
    //     </div>
    //     {!loading && !error && (
    //       <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
    //         <h1
    //           className="animate-fade-in mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
    //           style={{
    //             background: "linear-gradient(90deg, #f5e8c7, #d4af37, #ffffff)",
    //             backgroundClip: "text",
    //             WebkitBackgroundClip: "text",
    //             color: "transparent",
    //             textShadow: "0 0 10px rgba(212, 175, 55, 0.6)",
    //           }}
    //         >
    //           {displayData.title}
    //         </h1>
    //         <p className="animate-fade-in mb-8 max-w-2xl text-lg md:text-2xl">
    //           {displayData.subtitle}
    //         </p>
    //         <div className="relative">
    //           <motion.div
    //             className="absolute inset-0"
    //             variants={borderVariants}
    //             animate="animate"
    //             style={{
    //               borderRadius: "12px",
    //               padding: "4px",
    //               zIndex: -1,
    //             }}
    //           />
    //           <Button
    //             asChild
    //             className="p-6 text-lg animate-fade-in bg-gradient-to-r from-gray-900 to-indigo-900 text-white border-none"
    //           >
    //             <Link href="/shop">{heroTexts.h3}</Link>
    //           </Button>
    //         </div>
    //       </div>
    //     )}
    //   </div>
    // </section>
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
                  priority={index === 1}
                  className="object-cover"
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
              Authentic Rudraksha Beads
            </h1>
            <p className="text-white/80 text-lg mb-8">
              Discover the divine power of genuine Rudraksha beads, sourced directly from Nepal&apos;s sacred forests.
              Experience spiritual growth and positive energy with our authentic collection.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="relative overflow-hidden py-4 px-8 inline-block font-bold tracking-wider align-middle duration-500 text-lg text-center rounded-xl transition-all hover:scale-105 focus:outline-noen focus:ring-4 focus:ring-[#600000]/50
                bg-gradient-to-r from-[#D4AF37] to-[#8B1A1A] hover:[#D4AF37] hover:to-[#8B1A1A] text-white shadow-lg hover:shadow-[#D4AF37]/25 active:scale-95"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 ${currentSlide === index
              ? "bg-brassGold scale-110"
              : "bg-white/20 hover:bg-white/30"
              }`}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
    </section>
  );
}