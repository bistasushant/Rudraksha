"use client";

import { motion } from "framer-motion";
import { Heart, Bot as Lotus, Shield, Sparkles } from "lucide-react";
import { COLORS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { IBenefit } from "@/types";
import HTMLContent from "../HTMLContent";

const iconMap: Record<string, React.ElementType> = {
  Heart,
  Lotus,
  Shield,
  Sparkles
};

// Static icons array to map with dynamic data
const staticIcons = ["Lotus", "Heart", "Shield", "Sparkles"];

export default function Benefits() {
  const [benefitData, setBenefitData] = useState<IBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const response = await fetch('/api/benefit');
        const data = await response.json();
        if(!data.error && data.data?.benefits) {
          setBenefitData(data.data.benefits);
        }
      } catch (error) {
        console.error('Error fetching benefit data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBannerData();
  }, []);

  if (isLoading) {
    return (
        <section className="py-20 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-xl animate-pulse">
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-8"></div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
            </div>
        </section>
    );
  }

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
            Sacred Benefits of Rudraksha
          </h2>
          <p className="text-[#F5F5DC]/80 max-w-2xl mx-auto">
            For centuries, these sacred seeds have been revered for their powerful spiritual and healing properties.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefitData?.map((benefit, index) => {
            // Get icon from static array based on index, cycling through if more items than icons
            const iconName = staticIcons[index % staticIcons.length];
            const Icon = iconMap[iconName];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex p-6 rounded-lg border border-[#B87333]/30 hover:border-[#B87333] transition-colors"
              >
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                  style={{ backgroundColor: COLORS.antiqueCopper }}
                >
                  {Icon && <Icon size={24} className="text-[#F5F5DC]" />}
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#F5F5DC] mb-2">{benefit.title}</h3>
                  <div className="text-[#F5F5DC]/70">
                    <HTMLContent html={benefit.description} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}