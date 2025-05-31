import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse, CartItem } from "@/types";
import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Products";

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
    const { productId, quantity } = body;

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

    const existingItem = cart.items.find(
      (item: CartItem) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + quantity, 100);
    } else {
      cart.items.push({
        productId: new mongoose.Types.ObjectId(productId),
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        quantity,
      });
    }

    await cart.save();

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
          })),
        },
      } as ApiResponse<{ _id: string; items: CartItem[] }>,
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

    const cart = await Cart.findOne({ customerId: user._id }).populate(
      "items.productId"
    );

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
            })),
          }
          : { _id: null, items: [] },
      } as ApiResponse<{ _id: string | null; items: CartItem[] }>,
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
    const { productId, quantity } = body;

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
          })),
        },
      } as ApiResponse<{ _id: string; items: CartItem[] }>,
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
          data: { _id: null, items: [] },
        } as ApiResponse<{ _id: string | null; items: CartItem[] }>,
        { status: 200 }
      );
    }

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
          })),
        },
      } as ApiResponse<{ _id: string; items: CartItem[] }>,
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
