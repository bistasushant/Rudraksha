import { connectDB } from "@/lib/mongodb";
import { ApiResponse, CartItem } from "@/types";
import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Products";
import { hasAuth } from "@/lib/auth";

// Helper function to calculate cart totals
const calculateCartTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((total, item) => {
    const itemPrice = item.price;
    const sizePrice = item.size?.price || 0;
    const designPrice = item.design?.price || 0;
    return total + (itemPrice + sizePrice + designPrice) * item.quantity;
  }, 0);
  
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  return { subtotal, totalItems };
};

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const { user, response } = await hasAuth(req);
    if (!user || response) {
      return NextResponse.json(
        {
          error: true,
          message: "Authentication required to add to cart",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, quantity, size, design } = body;

    console.log("Received cart data:", { productId, quantity, size, design });

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: true, message: "Invalid product ID" } as ApiResponse,
        { status: 400 }
      );
    }

    if (
      !quantity ||
      typeof quantity !== "number" ||
      quantity <= 0 ||
      quantity > 100
    ) {
      return NextResponse.json(
        {
          error: true,
          message: "Quantity must be a number between 1 and 100",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: true, message: "Product not found" } as ApiResponse,
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: true, message: "Insufficient stock" } as ApiResponse,
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({ customerId: user._id });
    if (!cart) {
      cart = new Cart({ customerId: user._id, items: [] });
    }

    if (
      cart.items.length >= 50 &&
      !cart.items.some(
        (item: CartItem) => item.productId.toString() === productId
      )
    ) {
      return NextResponse.json(
        {
          error: true,
          message: "Cart cannot exceed 50 unique items",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const existingItem = cart.items.find((item: CartItem) => {
      // First check if product IDs match
      if (item.productId.toString() !== productId) return false;

      // If no size or design in either item, just check ID
      if (!item.size && !size && !item.design && !design) {
        return true;
      }

      // Check size if either item has size
      if (item.size || size) {
        const sizeMatch = (() => {
          if (!item.size && !size) return true;
          if (!item.size || !size) return false;
          
          if ('sizeId' in item.size && 'sizeId' in size) {
            return item.size.sizeId === size.sizeId;
          } else if ('size' in item.size && 'size' in size) {
            return item.size.size === size.size;
          }
          return false;
        })();
        if (!sizeMatch) return false;
      }

      // Check design if either item has design
      if (item.design || design) {
        const designMatch = (() => {
          if (!item.design && !design) return true;
          if (!item.design || !design) return false;
          // Check both 'title' and 'design' property for compatibility
          const itemDesignValue = item.design?.title;
          const newDesignValue = design?.title || design?.design;
          return itemDesignValue === newDesignValue;
        })();
        if (!designMatch) return false;
      }

      return true;
    });

    if (existingItem) {
      return NextResponse.json(
        {
          error: true,
          message: "Item already in cart",
        } as ApiResponse,
        { status: 400 }
      );
    }

    cart.items.push({
      productId: new mongoose.Types.ObjectId(productId),
      name: product.name,
      image: product.images?.[0] || "",
      price: product.price,
      quantity,
      size: size ? {
        size: size.size,
        price: size.price,
        sizeId: size.sizeId
      } : undefined,
      design: design ? {
        title: design.title || "",
        price: design.price,
        image: design.image
      } : undefined,
    });

    console.log("Saving cart item:", cart.items[cart.items.length - 1]);

    const { subtotal, totalItems } = calculateCartTotals(cart.items);
    cart.subtotal = subtotal;
    cart.totalItems = totalItems;

    await cart.save();
    console.log("Cart saved successfully:", cart);

    return NextResponse.json(
      {
        error: false,
        message: "Product added to cart successfully",
        data: {
          _id: cart._id.toString(),
          items: cart.items.map((item: CartItem) => ({
            productId: item.productId.toString(),
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            size: item.size,
            design: item.design
          })),
          subtotal: cart.subtotal,
          totalItems: cart.totalItems
        },
      } as ApiResponse<{ _id: string; items: CartItem[]; subtotal: number; totalItems: number }>,
      { status: 201 }
    );
  } catch (error) {
    console.error("Add to Cart Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const { user, response } = await hasAuth(req);
    if (!user || response) {
      return (
        response ||
        NextResponse.json(
          {
            error: true,
            message: "Authentication required to view cart",
          } as ApiResponse,
          { status: 401 }
        )
      );
    }

    const cart = await Cart.findOne({ customerId: user._id })
      .populate({
        path: 'items.productId',
        select: 'name price stock images description benefit sizes designs'
      });

    return NextResponse.json(
      {
        error: false,
        message: cart ? "Cart retrieved successfully" : "No cart found",
        data: cart
          ? {
              _id: cart._id.toString(),
              items: cart.items.map((item: CartItem) => ({
                productId: item.productId.toString(),
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                size: item.size,
                design: item.design,
                product: item.productId // This will now contain the full product data
              })),
              subtotal: cart.subtotal,
              totalItems: cart.totalItems
            }
          : { _id: null, items: [], subtotal: 0, totalItems: 0 },
      } as ApiResponse<{ _id: string | null; items: CartItem[]; subtotal: number; totalItems: number }>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Cart Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  await connectDB();

  try {
    const { user, response } = await hasAuth(req);
    if (!user || response) {
      return NextResponse.json(
        {
          error: true,
          message: "Authentication required to update cart",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, quantity, size, design } = body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: true, message: "Invalid product ID" } as ApiResponse,
        { status: 400 }
      );
    }

    if (
      !quantity ||
      typeof quantity !== "number" ||
      quantity <= 0 ||
      quantity > 100
    ) {
      return NextResponse.json(
        {
          error: true,
          message: "Quantity must be a number between 1 and 100",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: true, message: "Product not found" } as ApiResponse,
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: true, message: "Insufficient stock" } as ApiResponse,
        { status: 400 }
      );
    }

    const cart = await Cart.findOne({ customerId: user._id });
    if (!cart) {
      return NextResponse.json(
        { error: true, message: "Cart not found" } as ApiResponse,
        { status: 404 }
      );
    }

    const existingItem = cart.items.find(
      (item: CartItem) => item.productId.toString() === productId
    );

    if (!existingItem) {
      return NextResponse.json(
        { error: true, message: "Item not found in cart" } as ApiResponse,
        { status: 404 }
      );
    }

    existingItem.quantity = quantity;
    existingItem.name = product.name;
    existingItem.image = product.images?.[0] || "";
    existingItem.price = product.price;
    if (size) existingItem.size = size;
    if (design) existingItem.design = {
      title: design.title || "",
      price: design.price,
      image: design.image
    };

    const { subtotal, totalItems } = calculateCartTotals(cart.items);
    cart.subtotal = subtotal;
    cart.totalItems = totalItems;

    await cart.save();

    return NextResponse.json(
      {
        error: false,
        message: "Cart item updated successfully",
        data: {
          _id: cart._id.toString(),
          items: cart.items.map((item: CartItem) => ({
            productId: item.productId.toString(),
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            size: item.size,
            design: item.design
          })),
          subtotal: cart.subtotal,
          totalItems: cart.totalItems
        },
      } as ApiResponse<{ _id: string; items: CartItem[]; subtotal: number; totalItems: number }>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Cart Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB();

  try {
    const { user, response } = await hasAuth(req);
    if (!user || response) {
      return NextResponse.json(
        {
          error: true,
          message: "Authentication required to remove item from cart",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: true, message: "Invalid product ID" } as ApiResponse,
        { status: 400 }
      );
    }

    const cart = await Cart.findOne({ customerId: user._id });
    if (!cart) {
      return NextResponse.json(
        { error: true, message: "Cart not found" } as ApiResponse,
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex(
      (item: CartItem) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: true, message: "Item not found in cart" } as ApiResponse,
        { status: 404 }
      );
    }

    cart.items.splice(itemIndex, 1);

    if (cart.items.length === 0) {
      await cart.deleteOne();
      return NextResponse.json(
        {
          error: false,
          message: "Cart item removed and cart deleted",
          data: { _id: null, items: [], subtotal: 0, totalItems: 0 },
        } as ApiResponse<{ _id: string | null; items: CartItem[]; subtotal: number; totalItems: number }>,
        { status: 200 }
      );
    }

    const { subtotal, totalItems } = calculateCartTotals(cart.items);
    cart.subtotal = subtotal;
    cart.totalItems = totalItems;

    await cart.save();

    return NextResponse.json(
      {
        error: false,
        message: "Cart item removed successfully",
        data: {
          _id: cart._id.toString(),
          items: cart.items.map((item: CartItem) => ({
            productId: item.productId.toString(),
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            size: item.size,
            design: item.design
          })),
          subtotal: cart.subtotal,
          totalItems: cart.totalItems
        },
      } as ApiResponse<{ _id: string; items: CartItem[]; subtotal: number; totalItems: number }>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Cart Item Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
