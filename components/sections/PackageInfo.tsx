import React from 'react';
import Image from 'next/image';
import { Award, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HTMLContent from '@/components/HTMLContent';
import Link from 'next/link';

interface PackageInfo {
  id: string;
  type: "package";
  title: string;
  description: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PackageInfoProps {
  packageInfo: PackageInfo | null;
}

const PackageInfo: React.FC<PackageInfoProps> = ({ packageInfo }) => {
  if (!packageInfo) return null;

  return (
    <div className="w-full py-8 sm:py-12 md:py-16 bg-gradient-to-b from-[#0F0F0F] via-[#1A1A1A] to-[#252525]">
      <div className="bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-blue-500/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:border-white/20 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 max-w-7xl mx-auto">
          {/* Title and Description */}
          <div className="flex-1 text-left w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-brassGold" />
              <h2 className="text-2xl sm:text-3xl font-bold text-ivoryWhite">{packageInfo.title}</h2>
            </div>
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-4 sm:mb-6"></div>
            <div className="text-white text-base sm:text-lg leading-relaxed">
              <HTMLContent html={packageInfo.description} />
            </div>
            <Link href="/shop">
              <Button
                size="lg"
                className="group relative w-full sm:w-2/12 mt-8 sm:mt-12 bg-gradient-to-r from-[#D4AF37] via-yellow-500 to-[#D4AF37] text-charcoalBlack font-bold text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-[#D4AF37]/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#D4AF37]/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-base">Shop Now</span>
                </div>
              </Button>
            </Link>
          </div>

          {/* Image */}
          <div className="relative w-full sm:w-80 md:w-96 h-48 sm:h-56 md:h-64 overflow-hidden flex-shrink-0 shadow-lg rounded-lg">
            <Image
              src={packageInfo.image || "/images/package.png"}
              alt={packageInfo.title}
              fill
              className="object-contain rounded-lg"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageInfo; 