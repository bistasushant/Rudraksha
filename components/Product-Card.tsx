import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Sparkles } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useCurrency } from "@/context/currency-context";
import { toast } from "sonner";
import { useWishlist } from "@/context/wishlist-context";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import {
  cartcontextEnglishTexts,
  cartcontextChineseTexts,
  cartcontextHindiTexts,
  cartcontextNepaliTexts,
} from "@/language";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  categoryNames?: string[];
  stock?: number;
  description?: string;
  sizes?: (
    | { size: string; price: number }  // For static small size
    | { sizeId: string; price: number }  // For other sizes
  )[];
  designs?: { title: string; price: number; image: string }[];
  slug?: string;
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { selectedLanguage } = useLanguage();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      if (inWishlist) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist({
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] || '/images/default-image.png',
          productPrice: product.price,
          productStock: product.stock || 1,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const cartcontextTexts =
    selectedLanguage === "chinese"
      ? cartcontextChineseTexts
      : selectedLanguage === "hindi"
        ? cartcontextHindiTexts
        : selectedLanguage === "nepali"
          ? cartcontextNepaliTexts
          : cartcontextEnglishTexts;

  const handleAddToCart = async () => {
    if (product.stock && product.stock > 0) {
      try {
        await addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] || "/images/default-image.png",
          quantity: 1,
        });
      } catch (error: unknown) {
        console.error("Add to Cart Error:", {
          message: error instanceof Error ? error.message : String(error),
          details: error,
        });
        toast.error(cartcontextTexts.h1, {
          description: `${error instanceof Error ? error.message : String(error)}`,
        });
      }
    } else {
      toast.error(cartcontextTexts.outOfStock, {
        description: `${product.name} is out of stock.`,
      });
    }
  };

  const getPriceInSelectedCurrency = (price: number): string => {
    const exchangeRate = exchangeRates[selectedCurrency] || 1;
    return (price * exchangeRate).toFixed(2);
  };

  const isInStock = product.stock === undefined || product.stock > 0;

  return (
    <div className="group relative">
      {/* Floating glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#D4AF37] via-[#F5F5DC] to-[#8B1A1A] rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500 group-hover:duration-200 animate-pulse"></div>

      {/* Main card */}
      <div className="relative bg-gradient-to-br from-[#8B1A1A] via-[#D4AF37] to-[#2A2A2A] rounded-3xl overflow-hidden shadow-2xl hover:shadow-[#D4AF37]/25 transition-all duration-500 transform hover:scale-[1.02] border border-[#D4AF37]/20 backdrop-blur-sm">

        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        {/* Image container with magnetic hover effect */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#2A2A2A] to-[#2A2A2A]">
          <Link href={`/product/${product.id}`}>
            <div className="relative w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out">
              <Image
                src={product.images[0] || "/images/default-image.png"}
                alt={product.name}
                fill
                className={`object-contain transition-all duration-700 ${!isInStock ? "opacity-50 grayscale" : "opacity-100"} group-hover:brightness-110`}
              />

              {/* Shimmer overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-200"></div>
            </div>
          </Link>

          {/* Floating wishlist button with magnetic effect */}
          <button
            onClick={handleWishlistClick}
            aria-label="Add to wishlist"
            className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all duration-300 transform hover:scale-125 hover:-translate-y-1 shadow-lg hover:shadow-xl ${inWishlist
              ? "bg-gradient-to-r from-[#8B1A1A] to-pink-500 text-white shadow-[#8B1A1A]/50"
              : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
              }`}
          >
            {inWishlist ? (
              <FaHeart className="w-5 h-5 animate-pulse" />
            ) : (
              <FaRegHeart className="w-5 h-5" />
            )}
          </button>

          {/* Premium stock badge */}
          {!isInStock && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-[#8B1A1A] to-[#8B1A1A] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm border border-[#8B1A1A]/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                {cartcontextTexts.outOfStock}
              </div>
            </div>
          )}

          {/* Sparkle effect for in-stock items */}
          {isInStock && (
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Sparkles className="w-6 h-6 text-brassGold animate-pulse" />
            </div>
          )}
        </div>

        {/* Content section with glassmorphism */}
        <div className="relative p-6 bg-gradient-to-br from-[#1C1C1C]/90 to-[#1C1C1C]/90 backdrop-blur-sm">
          {/* Premium title section */}
          <div className="mb-4">
            <Link href={`/product/${product.id}`} className="block group/title">
              <h3 className="font-bold text-xl text-white mb-2 group-hover/title:text-transparent group-hover/title:bg-clip-text group-hover/title:bg-gradient-to-r group-hover/title:from-[#D4AF37] group-hover/title:to-pink-400 transition-all duration-300">
                {product.name}
              </h3>
            </Link>

            {/* Animated category tags */}
            {product.categoryNames && product.categoryNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {product.categoryNames.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-[#brassGold]/20 to-[#8B1A1A]/20 text-purple-300 rounded-full border border-purple-400/30 backdrop-blur-sm hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            {/* Stock indicator with animation */}
            <div className="flex items-center gap-2 text-sm">
              {isInStock ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">
                    {cartcontextTexts.inStock}
                    {product.stock !== undefined && (
                      <span className="text-green-300 ml-1">({product.stock} available)</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 font-medium">
                    {cartcontextTexts.outOfStock}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Price and action section */}
          <div className="flex items-center justify-between">
            {/* Animated price display */}
            <div className="relative">
              <span className="font-bold text-2xl bg-gradient-to-r from-[#D4AF37] via-[#B87333] to-[#D4AF37] bg-clip-text text-transparent group-hover:animate-pulse">
                {selectedCurrency === "USD"
                  ? "$"
                  : selectedCurrency === "CNY"
                    ? "¥"
                    : selectedCurrency === "INR"
                      ? "₹"
                      : selectedCurrency === "NPR"
                        ? "₨"
                        : ""}
                {getPriceInSelectedCurrency(product.price)}
              </span>
              {/* Price glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#B87333]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Premium CTA button */}
            <Button
              size="sm"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              disabled={!isInStock}
              className={`relative overflow-hidden px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#600000]/50 ${!isInStock
                ? "opacity-50 cursor-not-allowed bg-gray-600 text-gray-400"
                : "bg-gradient-to-r from-[#D4AF37] to-[#8B1A1A] hover:[#D4AF37] hover:to-[#8B1A1A] text-white shadow-lg hover:shadow-[#D4AF37]/25 active:scale-95"
                }`}
            >
              {/* Button background animation */}
              {isInStock && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#2A2A2A]/20 to-[#D4AF37]/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}

              <div className="relative flex items-center gap-2">
                <ShoppingCart className={`h-5 w-5 transition-transform duration-300 ${isInStock ? 'group-hover:animate-bounce' : ''}`} />
                <span>{cartcontextTexts.addToCart}</span>
              </div>
            </Button>
          </div>

          {/* Premium rating stars (placeholder) */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-3 h-3 text-brassGold fill-current"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-1 bg-gradient-to-r from-[#2A2A2A] via-[#B87333] to-[#2A2A2A] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
      </div>
    </div>
  );
};

export { ProductCard };