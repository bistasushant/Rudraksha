"use client";
import { useState, useRef, useEffect, useCallback } from "react";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TESTIMONIALS } from "@/lib/constants";
import DOMPurify from "dompurify";
import parse from "html-react-parser";

interface Testimonial {
  id: string;
  fullName: string;
  address: string;
  rating: number;
  description: string;
  image: string;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); // Track direction for animation
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSlideInterval = useRef<NodeJS.Timeout | null>(null);


  const renderHTMLContent = (html: string) => {
    const sanitizedHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "ol", "ul", "li", "strong", "em", "img", "br"],
      ALLOWED_ATTR: ["src", "alt", "class"],
    });
    return parse(sanitizedHTML);
  };

  const testimonialsPerPage = 3; // Number of testimonials to show at once
  const AUTO_SLIDE_DELAY = 5000; // 5 seconds for auto-change

  const nextTestimonial = useCallback(() => {
    setDirection(1); // Right movement
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = useCallback(() => {
    setDirection(-1); // Left movement
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Auto-slide effect
  useEffect(() => {
    if (testimonials.length <= testimonialsPerPage) return; // No auto-slide if not enough testimonials

    autoSlideInterval.current = setInterval(() => {
      nextTestimonial();
    }, AUTO_SLIDE_DELAY);

    return () => {
      if (autoSlideInterval.current) {
        clearInterval(autoSlideInterval.current);
      }
    };
  }, [testimonials.length, nextTestimonial]);

  // Reset auto-slide timer on manual navigation
  const resetAutoSlide = useCallback(() => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
      autoSlideInterval.current = setInterval(() => {
        nextTestimonial();
      }, AUTO_SLIDE_DELAY);
    }
  }, [nextTestimonial]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch("/api/testimonial?page=1&limit=10", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch testimonials");
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.message);
        }

        // Ensure at least 3 testimonials
        const fetchedTestimonials = data.data.testimonials;
        if (fetchedTestimonials.length < 3) {
          setTestimonials([...fetchedTestimonials, ...TESTIMONIALS.slice(0, 3 - fetchedTestimonials.length)]);
        } else {
          setTestimonials(fetchedTestimonials);
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setTestimonials(TESTIMONIALS.slice(0, 3).map(t => ({
          id: t.id.toString(),
          fullName: t.name,
          address: t.location,
          rating: t.rating,
          description: t.text,
          image: t.image
        })));
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-[#2A2A2A]">
        <div className="container mx-auto px-4">
          <div className="text-center text-[#F5F5DC]">Loading testimonials...</div>
        </div>
      </section>
    );
  }

  if (error && (!testimonials || testimonials.length === 0)) {
    return (
      <section className="py-16 bg-[#2A2A2A]">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-400">Error loading testimonials: {error}</div>
        </div>
      </section>
    );
  }

  // Calculate visible testimonials
  const visibleTestimonials = [];
  for (let i = 0; i < testimonialsPerPage; i++) {
    const index = (activeIndex + i) % testimonials.length;
    visibleTestimonials.push(testimonials[index]);
  }

  // Animation variants for sliding
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <section className="py-16 bg-[#2A2A2A]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
            Sacred Experiences
          </h2>
          <p className="text-[#F5F5DC]/80 max-w-2xl mx-auto">
            Hear from our community about how Rudraksha has transformed their spiritual journey.
          </p>
        </motion.div>

        <div className="relative max-w-8xl mx-auto">
          <div ref={containerRef} className="overflow-hidden h-[400px] relative">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={`${activeIndex}-${visibleTestimonials.map((t) => t.id).join("-")}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {visibleTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="px-2">
                    <div className="bg-[#1C1C1C] rounded-lg p-6 h-full flex flex-col">
                      <div className="flex flex-col items-center mb-6">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden mb-4">
                          <Image
                            src={testimonial.image}
                            alt={`${testimonial.fullName} avatar`}
                            width={100}
                            height={100}
                            className="object-cover"
                          />
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-medium text-[#F5F5DC]">{testimonial.fullName}</h4>
                          <p className="text-sm text-[#F5F5DC]/70">{testimonial.address}</p>
                        </div>
                        <div className="flex mt-2">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} size={18} fill="#D4AF37" color="#D4AF37" />
                          ))}
                        </div>
                      </div>
                      <div className="testimonial-description text-[#F5F5DC]/90 italic text-base text-center flex-grow">
                        {renderHTMLContent(testimonial.description)}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center mt-8 space-x-2">
            <Button
              size="icon"
              onClick={() => {
                prevTestimonial();
                resetAutoSlide();
              }}
              className="border-[#B87333] text-[#B87333] hover:bg-[#B87333]/20"
            >
              <ChevronLeft size={10} />
            </Button>
            <div className="flex space-x-2 py-3">
              {Array.from({ length: testimonials.length }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveIndex(index);
                    setDirection(index > activeIndex ? 1 : -1);
                    resetAutoSlide();
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${index === activeIndex ? "bg-[#B87333]" : "bg-[#B87333]/30"
                    }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            <Button
              size="icon"
              onClick={() => {
                nextTestimonial();
                resetAutoSlide();
              }}
              className="border-[#B87333] text-[#B87333] hover:bg-[#B87333]/20"
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}