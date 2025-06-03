import React from "react";
import Hero from "@/components/sections/Hero";
// import Features from "@/components/Features";
import Benefits from "@/components/sections/Benefits";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ValueProposition from "@/components/sections/Value-Proposotion";
import Categories from "@/components/sections/category/Categories";
import LimitedTimeDeal from "@/components/sections/Limited-Time-Deal";
import Banner from "@/components/sections/Banner";
import TopSelling from "@/components/sections/Top-Selling";
import InstagramFeed from "@/components/sections/Instagram-feed";
import Certifications from "@/components/sections/Certifications";
import BlogHighlights from "@/components/sections/BlogHighlights";
import Timeline from "@/components/sections/Timeline";
import EcoResponsibility from "@/components/sections/EcoResponsibility";
import FAQ from "@/components/sections/Faq";
import Newsletter from "@/components/sections/Newsletter";
import FloatingChat from "@/components/sections/Floating-Chart";
import Testimonial from "@/components/sections/Testimonial";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      {/* <Features /> */}
      <ValueProposition />
      <Categories />
      <LimitedTimeDeal />
      <Banner />
      <TopSelling />
      <Benefits />
      <InstagramFeed />
      <Certifications />
      <BlogHighlights />
      <Timeline />
      <EcoResponsibility />
      <Testimonial />
      <FAQ />
      <Newsletter />
      <Footer />
      <FloatingChat />
    </>
  );
}
