"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ApiResponse } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Star, ArrowRight, Sparkles, Grid, List } from 'lucide-react';
import { RichTextContent } from '@/components/ui/RichTextContent';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  description: string;
  benefit: string;
  subcategory: {
    name: string;
    slug: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  benefit?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    rotateX: -15
  },
  visible: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 20
    }
  },
  hover: {
    y: -10,
    scale: 1.05,
    rotateY: 5,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

const slideInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay: 0.2
    }
  }
};

export default function CategoryDetail() {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const { slug } = useParams();
  const router = useRouter();
  // Function to strip HTML tags
  const stripHtmlTags = (str: string) => {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  };

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        const response = await fetch(`/api/products/category/${slug}`);
        const data: ApiResponse<{ category: Category; products: Product[] }> = await response.json();

        if (data.error || !data.data) {
          throw new Error(data.message || 'Failed to fetch data');
        }

        // Only strip HTML tags from product descriptions, preserve category description and benefit
        data.data.products = data.data.products.map(product => ({
          ...product,
          description: stripHtmlTags(product.description)
        }));

        setCategory(data.data.category);
        setProducts(data.data.products);
      } catch (error) {
        console.error('Error fetching category details:', error);
        toast.error('Failed to load category details');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'stock':
        return b.stock - a.stock;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div 
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-400 rounded-full"></div>
          <motion.div 
            className="absolute inset-3 w-16 h-16 border-4 border-pink-500/30 border-b-pink-400 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-6 w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-purple-500/25">
            <Package className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Category Not Found</h2>
          <p className="text-gray-300 mb-8">The category you&apos;re looking for doesn&apos;t exist.</p>
          <motion.button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
  
    <div className="min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-[#B87333]/20 to-[#D4AF37]/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-[#8B1A1A]/20 to-[#D4AF37]/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
      </div>

      {/* Floating Sparkles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[#D4AF37]/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:mt-20">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
            Category Details
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] rounded-full"></div>
        </motion.div>

        {/* Category Info Section */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Side - Category Image */}
          <motion.div 
            className="relative"
            variants={slideInLeft}
          >
            {category.image ? (
              <div className="relative h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              </div>
            ) : (
              <div className="h-96 lg:h-[500px] rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <Package className="h-24 w-24 text-purple-400/50" />
              </div>
            )}
          </motion.div>

          {/* Right Side - Category Details */}
          <motion.div 
            className="flex flex-col justify-center space-y-8"
            variants={slideInRight}
          >
            <div>
              <motion.h2 
                className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {category.name}
              </motion.h2>
              
              {category.description && (
                <>
                  <h3 className="text-3xl font-semibold text-gray-200 mb-4">Description</h3>
                  <RichTextContent 
                    content={category.description}
                    animation={{
                      initial: { opacity: 0, y: 20 },
                      animate: { opacity: 1, y: 0 },
                      transition: { delay: 0.6 }
                    }}
                  />
                </>
              )}
            </div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-purple-100 to-[#D4AF37] bg-clip-text text-transparent">
                  {products.length}
                </div>
                <div className="text-gray-300 text-sm font-medium mt-2">Total Products</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {products.filter(p => p.stock > 0).length}
                </div>
                <div className="text-gray-300 text-sm font-medium mt-2">In Stock</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Benefits Section */}
        {category.benefit && (
          <motion.div 
            className="mb-16 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="text-3xl font-semibold text-gray-200 mb-6">Benefits</h3>
            <RichTextContent 
              content={category.benefit}
              animation={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.7 }
              }}
            />
          </motion.div>
        )}

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {/* Section Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
            <div>
              <h3 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
                {category.name} Products
              </h3>
              <p className="text-gray-300 text-lg">Discover amazing products in this category</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-6 md:mt-0">
              <motion.select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                whileHover={{ scale: 1.02 }}
              >
                <option value="name" className="bg-slate-800">Sort by Name</option>
                <option value="price" className="bg-slate-800">Sort by Price</option>
                <option value="stock" className="bg-slate-800">Sort by Stock</option>
              </motion.select>

              <div className="flex bg-white/10 rounded-xl p-1 backdrop-blur-sm">
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brassGold text-white' : 'text-gray-400 hover:text-white'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Grid className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brassGold text-white' : 'text-gray-400 hover:text-white'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <List className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div 
                key="grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {sortedProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    variants={cardVariants}
                    whileHover="hover"
                    className="group cursor-pointer"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative h-64 overflow-hidden">
                        <Image
                          src={product.images[0] || '/placeholder.png'}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                          <span 
                            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                              product.stock > 10 ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                              product.stock > 0 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 
                              'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 relative z-10">
                        <h4 className="text-xl font-bold text-white mb-3 group-hover:text-[#B87333]/90 transition-colors cursor-pointer">
                          {product.name}
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-black bg-gradient-to-r from-[#B87333] to-[#D4AF37] bg-clip-text text-transparent">
                            Rs {product.price.toFixed(2)}
                          </span>
                          
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current opacity-30" />
                          </div>
                        </div>

                        <motion.div 
                          className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300"
                          initial={{ x: -10 }}
                          whileHover={{ x: 0 }}
                        >
                          <ArrowRight className="h-5 w-5 text-brassGold" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {sortedProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    variants={itemVariants}
                    className="group cursor-pointer"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                          <Image
                            src={product.images[0] || '/placeholder.png'}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xl font-bold text-white mt-2 mb-2 cursor-pointer hover:text-[#B87333] transition-colors">
                                {product.name}
                              </h4>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-black bg-gradient-to-r from-[#B87333] to-[#D4AF37] bg-clip-text text-transparent">
                                ${product.price.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-400 mt-1">
                                Stock: {product.stock}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {products.length === 0 && (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-24 h-24 bg-gradient-to-r from-[#B87333] to-[#D4AF37] rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
                <Package className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Products Found</h3>
              <p className="text-gray-300 text-lg">This category doesn&apos;t have any products yet.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
    </>
  );
}
