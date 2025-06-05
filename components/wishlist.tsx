"use client";

import { useEffect, useState } from "react"
import { Search, ShoppingCart, Trash2, Heart, Sparkles } from "lucide-react"
import { FaHeart } from "react-icons/fa"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useWishlist, WishlistItem } from "@/context/wishlist-context"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState("all")
  const { addItem } = useCart()
  const { wishlist, removeFromWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize wishlist when component mounts
  useEffect(() => {
    const initializeWishlist = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check authentication
        const storedToken = localStorage.getItem('token')
        const storedRole = localStorage.getItem('role')
        
        if (!storedToken || !storedRole) {
          setError("Please log in to view your wishlist")
          return
        }

        // Wait for auth context to initialize
        let retryCount = 0
        while (!isAuthenticated && retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 500))
          retryCount++
        }

        // If we have a token but auth context isn't ready, use stored data
        if (!isAuthenticated && storedToken) {
          console.log("Using stored authentication data")
          // Continue with stored token
        } else if (!isAuthenticated) {
          setError("Please log in to view your wishlist")
          return
        }

        // Set wishlist items
        if (Array.isArray(wishlist)) {
          setWishlistItems(wishlist)
          setIsInitialized(true)
        } else {
          console.warn("Wishlist is not an array:", wishlist)
          setWishlistItems([])
        }
      } catch (error) {
        console.error("Error initializing wishlist:", error)
        setError("Failed to load wishlist")
        toast.error("Failed to load wishlist")
      } finally {
        setLoading(false)
      }
    }

    initializeWishlist()
  }, [wishlist, isAuthenticated])

  // Update wishlist items when wishlist changes
  useEffect(() => {
    if (Array.isArray(wishlist) && isInitialized) {
      setWishlistItems(wishlist)
    }
  }, [wishlist, isInitialized])

  const addToCart = async (item: WishlistItem) => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      toast.error("Please log in to add items to cart")
      return
    }

    try {
      await addItem({
        id: item.productId,
        name: item.productName,
        price: item.productPrice,
        image: item.productImage,
        quantity: 1,
      })
      toast.success("Item added to cart")
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add to cart")
    }
  }

  const handleRemoveItem = async (productId: string) => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      toast.error("Please log in to manage your wishlist")
      return
    }

    try {
      await removeFromWishlist(productId)
      toast.success("Item removed from wishlist")
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Error removing item")
    }
  }

  // Filter and sort products
  const filteredItems = wishlistItems
    .filter((item) => 
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "price-low") {
        return (a.productPrice || 0) - (b.productPrice || 0)
      } else if (sortOption === "price-high") {
        return (b.productPrice || 0) - (a.productPrice || 0)
      } else if (sortOption === "newest") {
        return new Date(b._id?.substring(0, 8) || "").getTime() -
          new Date(a._id?.substring(0, 8) || "").getTime()
      }
      return 0
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-200 border-t-rose-500 mx-auto"></div>
            <p className="text-xl font-medium bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Loading your wishlist...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const storedToken = localStorage.getItem('token')
  if ((!isAuthenticated && !storedToken) || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-rose-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {error || "Please log in"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {error ? "There was an error loading your wishlist. Please try again." : "You need to be logged in to view and manage your wishlist."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
  
      <div className="relative z-10 space-y-8 p-6 md:p-8 md:mt-16">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              My Wishlist
            </h1>
            <Sparkles className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          <p className="text-lg text-ivoryWhite dark:text-gray-300 max-w-2xl mx-auto">
            Your curated collection of favorite items. {filteredItems.length} treasures waiting for you.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="border border-[#D4AF37]/40 shadow-xl bg-[#2A2A2A]/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white" />
                  <Input
                    type="search"
                    placeholder="Search your wishlist..."
                    className="pl-12 h-12 border-2 border-gray-200 text-ivoryWhite dark:border-gray-600 rounded-xl bg-[#2A2A2A]/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-full sm:w-[180px] h-12 border-2d border-gray-200 text-white dark:border-gray-600 rounded-xl bg-[#2A2A2A]/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-rose-500 transition-all duration-300">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 bg-[#2A2A2A]/95 text-white dark:bg-gray-800/95 backdrop-blur-lg">
                    <SelectItem value="all" className="rounded-lg text-dark transition-colors duration-200">All Items</SelectItem>
                    <SelectItem value="price-low" className="rounded-lg text-dark hover:bg-white hover:text-gray-900 transition-colors duration-200">Price: Low to High</SelectItem>
                    <SelectItem value="price-high" className="rounded-lg text-dark hover:bg-white hover:text-gray-900 transition-colors duration-200">Price: High to Low</SelectItem>
                    <SelectItem value="newest" className="rounded-lg text-dark hover:bg-white hover:text-gray-900 transition-colors duration-200">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wishlist Items */}
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <Card className="border-0 shadow-xl bg-[#2A2A2A]/80 dark:bg-gray-800/80 backdrop-blur-lg">
              <CardContent className="py-20">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                    <Heart className="w-12 h-12 text-rose-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-ivoryWhite dark:text-gray-200">Your wishlist is empty</h3>
                    <p className="text-ivoryWhite dark:text-gray-400 max-w-md mx-auto">
                      Start exploring and add items to your wishlist to see them here. Your perfect finds are just a click away!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <div
                  key={item._id || item.productId}
                  className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 dark:border-gray-700/20"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1C1C1C] via-[#2A2A2A] to-[#D4AF37] rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500 group-hover:duration-200 animate-pulse"></div>

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveItem(item.productId);
                    }}
                    aria-label="Remove from wishlist"
                    className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border border-rose-200 dark:border-rose-800"
                  >
                    <FaHeart className="w-5 h-5 text-rose-500 group-hover:animate-pulse" />
                  </button>

                  {/* Product Image */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#2A2A2A] to-[#2A2A2A] dark:from-gray-700 dark:to-gray-800">
                    <div className="relative w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out">
                      <Image
                        src={item.productImage || "/images/default-image.png"}
                        alt={item.productName || "Product image"}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-200"></div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-deepGraphite dark:text-gray-200 line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-300">
                        {item.productName}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                          Rs {(item.productPrice || 0).toLocaleString()}
                        </p>
                        {item.productStock > 0 ? (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                            In Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-500 border-red-200 dark:border-red-800 font-medium bg-red-50 dark:bg-red-900/20">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-[#8B1A1A]/70 via-[#D4AF37]/60 to-[#B87333]/80 hover:from-[#8B1A1A] hover:via-[#D4AF37] hover:to-[#B87333] text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={!item.productStock || item.productStock <= 0}
                        onClick={() => addToCart(item)}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="shrink-0 w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group/btn"
                      >
                        <Trash2 className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover/btn:text-red-500 transition-colors duration-300" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}