"use client";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/language-context";
import Image from "next/image";

import {
  contactEnglishTexts,
  contactChineseTexts,
  contactHindiTexts,
  contactNepaliTexts,
} from "@/language";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";

interface ContactDetails {
  address?: string;
  email?: string;
  phone?: string;
  mapEmbedUrl?: string;
}

export default function Contact() {
  const { selectedLanguage } = useLanguage();
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch contact details from API
    const fetchContactDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/sitesetting/contact");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch contact details: ${response.statusText}`
          );
        }
        const data = await response.json();

        if (data?.data) {
          setContactDetails({
            address: data.data.address,
            email: data.data.email,
            phone: data.data.phone,
            mapEmbedUrl: data.data.mapEmbedUrl,
          });
        } else {
          console.warn("No contact details found in API response");
          setContactDetails({});
        }
      } catch (err) {
        console.error("Error fetching contact details:", err);
        setError((err as Error).message || "Failed to fetch contact details");
        setContactDetails({});
      } finally {
        setLoading(false);
      }
    };

    fetchContactDetails();
  }, []);

  const contactTexts =
    selectedLanguage === "chinese"
      ? contactChineseTexts
      : selectedLanguage === "hindi"
        ? contactHindiTexts
        : selectedLanguage === "nepali"
          ? contactNepaliTexts
          : contactEnglishTexts;

  return (
    <>
      <Header />
      <section className="flex flex-col">
        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/Asthetic-contact.png"
              alt="Contact Us"
              fill
              priority
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
            <h1 className="mb-6 text-4xl text-ivoryWhite font-bold md:text-5xl lg:text-6xl">
              {contactTexts.h1}
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-[#F5F5DC]/70 md:text-xl">
              {contactTexts.h2}
            </p>
          </div>
        </div>

        {/* Contact Content */}
        <div className="bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-lg text-brassGold">Loading...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 p-6 text-center">
                <p className="text-red-600">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-12">
                {/* Contact Form */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-deepGraphite p-8 rounded-xl border border-[#B87333]/30 hover:border-[#B87333] transition-color">
                  <h2 className="text-3xl font-bold mb-6 flex text-ivoryWhite items-center gap-2">
                    <Send className="text-ivoryWhite" />
                    {contactTexts.h3}
                  </h2>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-lg text-ivoryWhite mb-2">
                        {contactTexts.h4}
                      </label>
                      <Input
                        type="text"
                        placeholder={contactTexts.h17}
                        className="h-12 text-lg text-ivoryWhite"
                      />
                    </div>
                    <div>
                      <label className="block text-lg text-ivoryWhite mb-2">
                        {contactTexts.h5}
                      </label>
                      <Input
                        type="email"
                        placeholder={contactTexts.h18}
                        className="h-12 text-lg text-ivoryWhite"
                      />
                    </div>
                    <div>
                      <label className="block text-lg text-ivoryWhite mb-2">
                        {contactTexts.h6}
                      </label>
                      <Textarea
                        placeholder={contactTexts.h19}
                        className="h-32 text-lg text-ivoryWhite"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full animate-fade-in bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] border-none font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 h-12 text-lg mt-2"
                    >
                      {contactTexts.sendMessage}
                    </Button>
                  </form>
                </motion.div>

                {/* Contact Info */}
                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-deepGraphite p-8 rounded-xl border border-[#B87333]/30 hover:border-[#B87333] transition-color">
                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
                      <MapPin className="text-ivoryWhite" />
                      <span className="text-ivoryWhite">{contactTexts.h14}</span>
                    </h2>
                    {contactDetails?.address ? (
                      <p className="text-ivoryWhite">{contactDetails.address}</p>
                    ) : (
                      <p className="text-himalayanRed">No Data</p>
                    )}
                    {contactDetails?.mapEmbedUrl ? (
                      <div className="aspect-video rounded-lg overflow-hidden mt-4">
                        <iframe
                          src={contactDetails.mapEmbedUrl}
                          className="w-full h-full"
                          loading="lazy"
                          allowFullScreen
                          title="Company Location"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>
                    ) : (
                      <p className="text-himalayanRed mt-4">No Map Available</p>
                    )}
                  </motion.div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="bg-deepGraphite p-6 rounded-xl border border-[#B87333]/30 hover:border-[#B87333] transition-color">
                      <div className="flex items-center gap-3 mb-4">
                        <Phone className="text-ivoryWhite" />
                        <h3 className="text-xl text-ivoryWhite font-semibold">
                          {contactTexts.phone}
                        </h3>
                      </div>
                      {contactDetails?.phone ? (
                        <p className="text-ivoryWhite">{contactDetails.phone}</p>
                      ) : (
                        <p className="text-himalayanRed">No Data</p>
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="bg-deepGraphite p-6 rounded-xl border border-[#B87333]/30 hover:border-[#B87333] transition-color">
                      <div className="flex items-center gap-3 mb-4">
                        <Mail className="text-ivoryWhite" />
                        <h3 className="text-xl text-ivoryWhite font-semibold">
                          {contactTexts.email}
                        </h3>
                      </div>
                      {contactDetails?.email ? (
                        <p className="text-ivoryWhite md:text-md">{contactDetails.email}</p>
                      ) : (
                        <p className="text-himalayanRed">No Data</p>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
