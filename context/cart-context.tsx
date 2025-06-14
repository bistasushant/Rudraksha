"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
import {
  cartcontextEnglishTexts,
  cartcontextChineseTexts,
  cartcontextHindiTexts,
  cartcontextNepaliTexts,
} from "@/language";
import { useAuth } from "./auth-context";

interface ApiCartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: {
    size: string;
    price: number;
    sizeId?: string;
  };
  design?: {
    title: string;
    price: number;
    image: string;
  };
}

interface ApiCartResponse {
  error: boolean;
  message: string;
  data: { _id: string | null; items: ApiCartItem[] };
}

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: { 
    size: string; 
    price: number; 
    sizeId?: string;
  };
  design?: { 
    title: string; 
    price: number; 
    image: string;
  };
};

type CartContextType = {
  cartItems: CartItem[];
  cartId: string | null;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isItemInCart: (id: string) => Promise<boolean>;
  totalItems: number;
  totalPrice: number;
  resetCartState: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [isFreshLogin, setIsFreshLogin] = useState(false);

  const { selectedLanguage } = useLanguage();
  const { isAuthenticated, username } = useAuth();

  const cartcontextTexts =
    selectedLanguage === "chinese"
      ? cartcontextChineseTexts
      : selectedLanguage === "hindi"
        ? cartcontextHindiTexts
        : selectedLanguage === "nepali"
          ? cartcontextNepaliTexts
          : cartcontextEnglishTexts;

  const resetCartState = useCallback(() => {
    setCartItems([]);
    setCartId(null);
    setTotalItems(0);
    setTotalPrice(0);
    localStorage.removeItem("cart");
  }, []);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !username || isClearingCart || isFreshLogin) {
      setCartItems([]);
      setCartId(null);
      setTotalItems(0);
      setTotalPrice(0);
      localStorage.removeItem("cart");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token available for fetching cart");
      }

      const response = await fetch("/api/cart", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const result: ApiCartResponse = await response.json();

      if (result.error) {
        throw new Error(result.message || "Failed to fetch cart");
      }

      const { data } = result;
      const items = (data.items || []).map((item: ApiCartItem) => ({
        id: item.productId.toString(),
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        size: item.size,
        design: item.design
      }));

      setCartItems(items);
      setCartId(data._id || null);
    } catch (error) {
      console.error("Fetch Cart Error:", error);
      setCartItems([]);
      setCartId(null);
      localStorage.removeItem("cart");
      if (error instanceof Error && error.message.includes("Authentication")) {
        toast.error("Authentication error", {
          description: "Please log out and log in again.",
        });
      } else if (
        error instanceof Error &&
        error.message.includes("HTTP error")
      ) {
        toast.error("Failed to fetch cart", {
          description: "Server error. Please try again later.",
        });
      }
      // No toast for empty cart (valid case)
    }
  }, [isAuthenticated, username, isClearingCart, isFreshLogin]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    const newTotal = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const newPrice = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    setTotalItems(newTotal);
    setTotalPrice(newPrice);
  }, [cartItems]);

  const addItem = useCallback(
    async (item: CartItem) => {
      try {
        const existingItem = cartItems.find(
          (cartItem) => cartItem.id === item.id
        );
        if (existingItem) {
          toast.info("Already in cart", {
            description: `${item.name} is already in your cart.`,
          });
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token available for adding item");
        }

        console.log("Sending cart item to API:", item);

        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.id,
            quantity: 1,
            size: item.size,
            design: item.design
          }),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText}`
          );
        }

        const result: ApiCartResponse = await response.json();

        if (result.error) {
          throw new Error(result.message || "Failed to add item to cart");
        }

        const items = (result.data.items || []).map((item: ApiCartItem) => ({
          id: item.productId.toString(),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          size: item.size,
          design: item.design
        }));
        setCartItems(items);
        setCartId(result.data._id || null);
        toast.success(cartcontextTexts.h3, {
          description: `${item.name} ${cartcontextTexts.h4}`,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes("No token available")) {
          toast.error("Please login to add items to cart");
        } else {
          toast.error("Failed to add to cart", {
            description: "Please try again or contact support.",
          });
        }
      }
    },
    [cartItems, cartcontextTexts]
  );

  const removeItem = useCallback(
    async (id: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token available for removing item");
        }

        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: id }),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText}`
          );
        }

        const result: ApiCartResponse = await response.json();

        if (result.error) {
          throw new Error(result.message || "Failed to remove item");
        }

        const items = (result.data.items || []).map((item: ApiCartItem) => ({
          id: item.productId.toString(),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
        }));
        setCartItems(items);
        setCartId(result.data._id || null);
        toast.success(cartcontextTexts.h5, {
          description: cartcontextTexts.h6,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes("No token available")) {
          toast.error("Please login to manage your cart");
        } else {
          toast.error("Failed to remove item", {
            description: "Please try again or contact support.",
          });
        }
      }
    },
    [cartcontextTexts]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity < 1) {
        await removeItem(id);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token available for updating quantity");
        }

        const response = await fetch("/api/cart", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: id, quantity }),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText}`
          );
        }

        const result: ApiCartResponse = await response.json();

        if (result.error) {
          throw new Error(result.message || "Failed to update quantity");
        }

        const items = (result.data.items || []).map((item: ApiCartItem) => ({
          id: item.productId.toString(),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          size: item.size,
          design: item.design
        }));
        setCartItems(items);
        setCartId(result.data._id || null);
      } catch (error) {
        if (error instanceof Error && error.message.includes("No token available")) {
          toast.error("Please login to update your cart");
        } else {
          toast.error("Product is out of stock", {
            description: "Please try again or contact support.",
          });
        }
      }
    },
    [removeItem]
  );

  const clearCart = useCallback(async () => {
    // Skip if already clearing cart to prevent duplicate operations
    if (isClearingCart) return;

    setIsClearingCart(true);
    setIsFreshLogin(true);

    // Clear client-side state immediately for better UX
    setCartItems([]);
    setCartId(null);
    setTotalItems(0);
    setTotalPrice(0);
    localStorage.removeItem("cart");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Don't show error if not authenticated - just clear local state
        return;
      }

      const response = await fetch("/api/cart/clear", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to clear cart: ${response.status} ${response.statusText}`,
          errorText
        );
        return; // Don't show error to user since cart is already cleared locally
      }

      const result = await response.json();
      if (result.error) {
        console.error("Failed to clear server cart:", result.message);
        // Don't show error to user since cart is already cleared locally
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("No token available")) {
        toast.error("Please login to manage your cart");
      } else {
        toast.error("Failed to clear cart", {
          description: "Please try again or contact support.",
        });
      }
    } finally {
      setIsClearingCart(false);
      // Small delay to prevent race conditions with other cart operations
      setTimeout(() => setIsFreshLogin(false), 1000);
    }
  }, []);

  const isItemInCart = useCallback(
    async (id: string): Promise<boolean> => {
      return cartItems.some((item) => item.id === id);
    },
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isItemInCart,
        totalItems,
        totalPrice,
        resetCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
