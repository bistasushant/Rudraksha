"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useRef } from "react";
import { IProduct } from "@/types";
import { toast } from "sonner";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import {
    cartcontextEnglishTexts,
    cartcontextChineseTexts,
    cartcontextHindiTexts,
    cartcontextNepaliTexts,
} from "@/language";

interface ApiResponse<T> {
    error: boolean;
    message: string;
    data: T;
}

interface ProductListData {
    products: IProduct[];
}

export default function TopSelling() {
    const [featureProducts, setFeatureProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
    const [lastAddedProduct, setLastAddedProduct] = useState<string | null>(null);
    const [lastAddTime, setLastAddTime] = useState<number>(0);
    const addingRef = useRef<Set<string>>(new Set());
    const { addItem, isItemInCart } = useCart();
    const { selectedLanguage } = useLanguage();

    const cartcontextTexts =
        selectedLanguage === "chinese"
            ? cartcontextChineseTexts
            : selectedLanguage === "hindi"
                ? cartcontextHindiTexts
                : selectedLanguage === "nepali"
                    ? cartcontextNepaliTexts
                    : cartcontextEnglishTexts;

    useEffect(() => {
        const fetchFeatureProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/products/feature');
                if (!response.ok) {
                    let errorMsg = `Failed to fetch products: ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorMsg;
                    } catch (parseError) {
                        console.error("Error parsing response:", parseError);
                        throw new Error("Network or server error occurred.");
                    }
                    throw new Error(errorMsg);
                }

                const result: ApiResponse<ProductListData> = await response.json();
                if (result.error || !result.data || !Array.isArray(result.data.products)) {
                    console.error("Invalid API response structure:", result);
                    throw new Error("Received invalid data format from API.");
                }

                setFeatureProducts(result.data.products);
            } catch (error: unknown) {
                console.error("Error fetching feature products:", error);
                setError(error instanceof Error ? error.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchFeatureProducts();
    }, []);

    const handleAddToCart = useCallback(async (e: React.MouseEvent, product: IProduct) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        console.log("Add to cart clicked for product:", product);

        // Validate product data - handle both _id and id fields
        const productId = product._id || product.id;
        if (!product || !productId || !product.name || product.price === undefined || product.price === null) {
            console.error("Invalid product data:", product);
            toast.error("Error", {
                description: "Cannot add product to cart: Invalid product data",
            });
            return;
        }

        const productIdString = productId.toString();
        const currentTime = Date.now();

        // Multiple prevention layers
        if (addingRef.current.has(productIdString)) {
            console.log("Product already being added (ref check), ignoring");
            return;
        }

        if (isAddingToCart === productIdString) {
            console.log("Already adding this product (state check), ignoring click");
            return;
        }

        // Prevent duplicate clicks within 2 seconds
        if (lastAddedProduct === productIdString && (currentTime - lastAddTime) < 2000) {
            console.log("Duplicate click detected, ignoring");
            return;
        }

        // Add to ref set and state
        addingRef.current.add(productIdString);
        setIsAddingToCart(productIdString);
        setLastAddedProduct(productIdString);
        setLastAddTime(currentTime);

        try {
            // Check stock availability - be more lenient with stock check
            if (product.stock !== undefined && product.stock <= 0) {
                toast.error(cartcontextTexts.outOfStock || "Out of Stock", {
                    description: `${product.name} is out of stock.`,
                });
                return;
            }

            // Check if item is already in cart - make this check optional in case isItemInCart is failing
            let existing = false;
            try {
                if (isItemInCart) {
                    existing = await isItemInCart(productIdString);
                }
            } catch (cartCheckError) {
                console.warn("Failed to check if item is in cart:", cartCheckError);
                // Continue anyway - don't block the add to cart
            }

            if (existing) {
                toast.info("Already in cart", {
                    description: `${product.name} is already in your cart.`,
                    id: `info-${productIdString}`,
                });
                return;
            }

            // Prepare cart item with more robust data handling
            const cartItem = {
                id: productIdString,
                productId: productIdString,
                name: product.name,
                price: typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price),
                image: (product.images && product.images.length > 0) ? product.images[0] : "/images/default-image.png",
                quantity: 1,
                // Add size if product has sizes
                size: product.sizes && product.sizes.length > 0 ? 
                    'size' in product.sizes[0] ? 
                        { size: product.sizes[0].size, price: product.sizes[0].price } :
                        { size: "Custom", sizeId: product.sizes[0].sizeId.toString(), price: product.sizes[0].price }
                    : undefined,
                // Add design if product has designs
                design: product.designs && product.designs.length > 0 ? {
                    title: product.designs[0].title,
                    price: product.designs[0].price,
                    image: product.designs[0].image
                } : undefined
            };

            console.log("Adding cart item:", cartItem);

            // Validate cart item before adding
            if (!cartItem.id || !cartItem.name || isNaN(cartItem.price) || cartItem.price <= 0) {
                throw new Error("Invalid cart item data prepared");
            }

            // Add item to cart
            if (!addItem) {
                throw new Error("Add item function not available");
            }

            await addItem(cartItem);
            
            // Remove the success toast since it's already handled in the cart context
            console.log("Successfully added to cart:", cartItem);

        } catch (error: unknown) {
            console.error("Add to Cart Error:", {
                message: error instanceof Error ? error.message : String(error),
                details: error,
                product: product,
            });
            
            const errorMessage = error instanceof Error ? error.message : "Failed to add item to cart. Please try again.";
            
            toast.error(cartcontextTexts.h1 || "Error", {
                description: errorMessage,
                id: `error-${productIdString}-${currentTime}`, // Unique ID with timestamp
            });
        } finally {
            // Clean up after delay
            setTimeout(() => {
                addingRef.current.delete(productIdString);
                setIsAddingToCart(null);
            }, 1000);
        }
    }, [addItem, isItemInCart, cartcontextTexts, isAddingToCart, lastAddedProduct, lastAddTime]);

    if (loading) {
        return (
            <section className="py-16 bg-[#1C1C1C]">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
                            Our Most Featured Pieces
                        </h2>
                        <p className="text-[#F5F5DC]/80 max-w-2xl mx-auto">
                            Loading our featured products...
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(4)].map((_, index) => (
                            <div key={`skeleton-${index}-${Date.now()}`} className="animate-pulse">
                                <div className="bg-gray-700/50 aspect-square rounded-lg mb-4"></div>
                                <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="py-16 bg-[#1C1C1C]">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-red-500 font-semibold text-xl">Error loading featured products:</p>
                    <p className="mt-2 text-red-400">{error}</p>
                </div>
            </section>
        );
    }

    if (featureProducts.length === 0) {
        return null;
    }

    return (
        <section className="py-16 bg-[#1C1C1C]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
                        Our Most Featured Pieces
                    </h2>
                    <p className="text-[#F5F5DC]/80 max-w-2xl mx-auto">
                        Discover our featured Rudraksha products, each carefully selected for their
                        powerful spiritual properties and exquisite craftsmanship.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featureProducts.map((product) => (
                        <motion.div
                            key={`product-${product._id || product.id}-${product.slug}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                            whileHover={{ y: -5 }}
                            className="group"
                        >
                            <div className="relative">
                                <Link href={`/product/${product._id}`}>
                                    <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                                        <Image
                                            src={(product.images && product.images[0]) ? product.images[0] : '/placeholder.jpg'}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <h3 className="text-lg font-medium text-[#F5F5DC] mb-1">{product.name}</h3>
                                    <p className="text-[#B87333] font-medium">${(product.price / 135).toFixed(2)}</p>
                                </Link>
                                
                                {/* Add to Cart Button - Outside of Link */}
                                <div className="absolute top-0 left-0 right-0 bottom-16 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end rounded-lg pointer-events-none">
                                    <div className="p-4 w-full pointer-events-auto">
                                        <Button
                                            onClick={(e) => handleAddToCart(e, product)}
                                            className="w-full bg-[#F5F5DC] text-[#1C1C1C] hover:bg-[#F5F5DC]/90 cursor-pointer"
                                            type="button"
                                            disabled={isAddingToCart === (product._id || product.id)?.toString()}
                                        >
                                            <ShoppingCart size={16} className="mr-2" />
                                            {isAddingToCart === (product._id || product.id)?.toString() 
                                                ? "Adding..." 
                                                : "Add to Cart"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex justify-center mt-10">
                    <Link href="/shop">
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-[#B87333] bg-[#1C1C1C] text-white hover:bg-[#B87333]/20 hover:text-white"
                        >
                            View All Products
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}