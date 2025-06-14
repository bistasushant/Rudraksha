"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { BarChart, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";
import Header from "@/components/layout/Header";
import Footer from "@/components/Footer";
import {
  analyticsEnglishTexts,
  analyticsChineseTexts,
  analyticsHindiTexts,
  analyticsNepaliTexts,
} from "@/language";

interface AnalyticsData {
  trackingId?: string;
  enabled?: boolean;
  cookieDomain?: string;
  metrics?: {
    pageViews?: number;
    uniqueVisitors?: number;
    bounceRate?: number;
  };
}

export default function GoogleAnalytics() {
  const { selectedLanguage } = useLanguage();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const baseApiUrl = "http://localhost:3000";

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${baseApiUrl}/api/sitesetting/googleanalytics`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch analytics data: ${response.statusText}`
          );
        }
        const data = await response.json();
        if (data?.data) {
          setAnalyticsData(data.data);
        } else {
          console.warn("No analytics data found in API response");
          setAnalyticsData({});
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError((err as Error).message || "Failed to fetch analytics data");
        setAnalyticsData({});
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const analyticsTexts =
    selectedLanguage === "chinese"
      ? analyticsChineseTexts
      : selectedLanguage === "hindi"
        ? analyticsHindiTexts
        : selectedLanguage === "nepali"
          ? analyticsNepaliTexts
          : analyticsEnglishTexts;

  return (
    <>
      <Header />
      <section className="flex flex-col">
        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/analytics-bg.png"
              alt="Google Analytics"
              fill
              priority
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
              {analyticsTexts.h1}
            </h1>
            <p className="mb-8 max-w-2xl text-lg md:text-xl">
              {analyticsTexts.h2}
            </p>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-lg text-gray-600">
                  {analyticsTexts.loading}
                </p>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <p className="text-red-600">{error}</p>
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {analyticsTexts.tryAgain}
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Settings Card */}
                <Card className="shadow-lg transition-transform transform hover:scale-105 bg-white rounded-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-xl font-semibold">
                        {analyticsTexts.settings}
                      </span>
                      <Settings className="h-6 w-6 text-gray-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      {analyticsTexts.trackingId}:{" "}
                      {analyticsData?.trackingId || "N/A"}
                    </p>
                    <p>
                      {analyticsTexts.enabled}:{" "}
                      {analyticsData?.enabled ? "Yes" : "No"}
                    </p>
                    <p>
                      {analyticsTexts.cookieDomain}:{" "}
                      {analyticsData?.cookieDomain || "N/A"}
                    </p>
                  </CardContent>
                </Card>

                {/* Metrics Card */}
                <Card className="shadow-lg transition-transform transform hover:scale-105 bg-white rounded-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-xl font-semibold">
                        {analyticsTexts.metrics}
                      </span>
                      <BarChart className="h-6 w-6 text-gray-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      {analyticsTexts.pageViews}:{" "}
                      {analyticsData?.metrics?.pageViews || 0}
                    </p>
                    <p>
                      {analyticsTexts.uniqueVisitors}:{" "}
                      {analyticsData?.metrics?.uniqueVisitors || 0}
                    </p>
                    <p>
                      {analyticsTexts.bounceRate}:{" "}
                      {analyticsData?.metrics?.bounceRate || 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
