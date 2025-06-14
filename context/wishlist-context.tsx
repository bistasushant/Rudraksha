'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { toast } from 'sonner';

// --- Types ---
interface WishlistItem {
  _id?: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  productStock: number;
}

type WishlistContextType = {
  wishlist: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, 'userId'>) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// --- Provider Component ---
export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Fetch wishlist from server on mount
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token available');
        }

        const response = await fetch('/api/wishlist', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch wishlist');

        const data = await response.json();
        if (!data.error) {
          setWishlist(data.data);
        }
      } catch (error) {
        // Silently handle fetch errors
      }
    };

    fetchWishlist();
  }, []);

  // Add to wishlist with server sync
  const addToWishlist = useCallback(async (item: Omit<WishlistItem, 'userId'>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...item,
          userId
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update wishlist');
      }

      // Only update state after successful API call
      setWishlist(prev => {
        if (prev.some(i => i.productId === item.productId)) return prev;
        return [...prev, { ...item, userId }];
      });

      toast.success('Added to wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  }, []);

  // Remove from wishlist with server sync
  const removeFromWishlist = useCallback(async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to manage your wishlist');
      return;
    }

    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to remove from wishlist');
      }

      // Only update state after successful API call
      setWishlist(prev => prev.filter(item => item.productId !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  }, [wishlist]);

  // Check if a product is in the wishlist
  const isInWishlist = useCallback(
    (productId: string) => wishlist.some(item => item.productId === productId),
    [wishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

// --- Hook for easy usage ---
export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export type { WishlistItem };

export default WishlistContext;