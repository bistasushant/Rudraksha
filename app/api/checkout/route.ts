import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateCheckoutRequest } from "@/lib/validation";
import { ApiResponse, CheckoutRequest, ICart, ICheckout, ICityDocument, IProduct } from "@/types";
import { Checkout } from "@/models/Checkout";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Products";
import { city } from "@/models/City";

interface CartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: {
    size?: string;
    price: number;
    sizeId?: mongoose.Types.ObjectId;
  } | null;
  design?: {
    design: string;
    price: number;
    image: string;
  } | null;
}

interface CheckoutCreationAttributes {
  customerId: Types.ObjectId;
  cartId: Types.ObjectId;
  shippingDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    countryId: Types.ObjectId;
    provinceId: Types.ObjectId;
    cityId: Types.ObjectId;
    postalCode?: string;
    locationUrl?: string;
  };
  items: CartItem[];
  subtotal: number;
  shipping: number;
  totalAmount: number;
  itemsCount: number;
  status: ICheckout['status'];
  paymentStatus: ICheckout['paymentStatus'];
  paymentMethod?: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Authentication Check
    const { user, response: authResponse } = await hasAuth(req);
    if (!user || authResponse) {
      return (
        authResponse ||
        NextResponse.json(
          { error: true, message: "Unauthorized" } as ApiResponse,
          { status: 401 }
        )
      );
    }

    // Parse and Validate Request Body
    const body: CheckoutRequest = await req.json();
    console.log('Checkout Request Body:', JSON.stringify(body, null, 2));

    // Fetch Cart first to get items for validation
    const cartId = body.cartId;
    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid cart ID provided",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const cart = await Cart.findById(cartId).lean<ICart>();
    if (!cart) {
      return NextResponse.json(
        {
          error: true,
          message: "Cart not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    if (cart.items.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Cannot create checkout with an empty cart",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Add cart items to body for validation
    const validationBody = {
      ...body,
      items: cart.items.map(item => ({
        productId: item.productId.toString(),
        name: item.name || "Unknown Item",
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || "",
        size: item.size,
        design: item.design
      })),
      subtotal: cart.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0),
      shipping: 0, // Will be calculated later
      totalAmount: 0, // Will be calculated later
      itemsCount: cart.items.reduce((count, item) => count + (item.quantity || 1), 0)
    };

    const validationResult = validateCheckoutRequest(validationBody);
    console.log('Validation Result:', validationResult);

    if (!validationResult.isValid) {
      console.log('Validation Failed:', validationResult.errors);
      return NextResponse.json(
        {
          error: true,
          message: "Invalid checkout data provided",
          details: validationResult.errors?.join(", ") || "No specific errors provided",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      customerId,
      shippingDetails,
      paymentStatus,
      paymentMethod,
    } = body;

    // Verify ObjectId validity
    const objectIdFields = [
      { name: "customerId", value: customerId },
      { name: "cityId", value: shippingDetails.cityId },
      { name: "provinceId", value: shippingDetails.provinceId },
      { name: "countryId", value: shippingDetails.countryId }
    ];

    for (const field of objectIdFields) {
      if (!mongoose.Types.ObjectId.isValid(field.value)) {
        return NextResponse.json(
          {
            error: true,
            message: `Invalid ${field.name} provided`,
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Authorization Check
    if (customerId !== user._id.toString()) {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: customerId must match authenticated user",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Verify Cart Ownership
    if (cart.customerId && cart.customerId.toString() !== user._id.toString()) {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: You can only checkout your own cart",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Find City and Shipping Cost
    const cityData = await city.findById(shippingDetails.cityId).lean<ICityDocument>();
    if (!cityData || !cityData.isActive) {
      return NextResponse.json(
        {
          error: true,
          message: "City not found or is inactive. Shipping cost cannot be determined.",
        } as ApiResponse,
        { status: 404 }
      );
    }
    const shipping: number = cityData.shippingCost;

    // Batch fetch and validate products
    const productIds = cart.items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean<IProduct[]>();
    const productMap = new Map(products.map(p => [p._id?.toString() || "", p]));

    // Validate stock and update product inventory
    for (const item of cart.items) {
      const productDetails = productMap.get(item.productId.toString());
      if (!productDetails) {
        return NextResponse.json(
          {
            error: true,
            message: `Product not found: ${item.productId}`,
          } as ApiResponse,
          { status: 404 }
        );
      }
      
      if (productDetails.stock < item.quantity) {
        return NextResponse.json(
          {
            error: true,
            message: `Insufficient stock for ${productDetails.name || "product"}`,
          } as ApiResponse,
          { status: 400 }
        );
      }
      
      // Update product stock in an atomic operation
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productDetails._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      
      if (!updatedProduct) {
        return NextResponse.json(
          {
            error: true,
            message: `Failed to update stock for ${productDetails.name || "product"}: likely concurrent update or insufficient stock`,
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Calculate order totals
    const subtotal = cart.items.reduce((sum, item) => {
      const product = productMap.get(item.productId.toString());
      let itemTotal = (product?.price || item.price || 0) * item.quantity;
      
      // Add size price if exists
      if (item.size && item.size.price) {
        itemTotal += item.size.price * item.quantity;
      }
      
      // Add design price if exists
      if (item.design && item.design.price) {
        itemTotal += item.design.price * item.quantity;
      }
      
      return sum + itemTotal;
    }, 0);

    const itemsCount = cart.items.reduce((count, item) => {
      return count + (item.quantity > 0 ? item.quantity : 0);
    }, 0);

    if (itemsCount === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "No valid items in cart",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const totalAmount = subtotal + shipping;

    // Prepare checkout data with FIXED design mapping
    const checkoutData: CheckoutCreationAttributes = {
      customerId: new mongoose.Types.ObjectId(customerId),
      cartId: new mongoose.Types.ObjectId(cartId),
      shippingDetails: {
        fullName: sanitizeInput(shippingDetails.fullName),
        email: sanitizeInput(shippingDetails.email),
        phone: sanitizeInput(shippingDetails.phone),
        address: sanitizeInput(shippingDetails.address),
        countryId: new mongoose.Types.ObjectId(shippingDetails.countryId),
        provinceId: new mongoose.Types.ObjectId(shippingDetails.provinceId),
        cityId: new mongoose.Types.ObjectId(shippingDetails.cityId),
        postalCode: shippingDetails.postalCode ? sanitizeInput(shippingDetails.postalCode) : undefined,
        locationUrl: shippingDetails.locationUrl ? sanitizeInput(shippingDetails.locationUrl) : undefined,
      },
      items: cart.items.map((item) => {
        const product = productMap.get(item.productId.toString());
        
        // FIXED: Handle size mapping
        let size = null;
        if (item.size) {
          size = {
            size: 'size' in item.size ? item.size.size : "",
            price: Number(item.size.price || 0),
            sizeId: 'sizeId' in item.size && item.size.sizeId && mongoose.Types.ObjectId.isValid(item.size.sizeId) 
              ? new mongoose.Types.ObjectId(item.size.sizeId) 
              : undefined
          };
        }
        
        // FIXED: Handle design mapping with proper property checks
        let design: { design: string; price: number; image: string; } | null = null;
        if (item.design) {
          // Check for different possible property names
          let designName = "";
          if ('design' in item.design && item.design.design) {
            designName = item.design.design as string;
          } else if ('title' in item.design && item.design.title) {
            designName = item.design.title as string;
          } else if ('name' in item.design && item.design.name) {
            designName = item.design.name as string;
          }
          
          if (designName && item.design.image) {
            design = {
              design: designName,
              price: Number(item.design.price || 0),
              image: item.design.image
            };
          }
        }
        
        const mappedItem: CartItem = {
          productId: new mongoose.Types.ObjectId(item.productId),
          name: item.name || product?.name || "Unknown Item",
          price: item.price || product?.price || 0,
          quantity: item.quantity || 1,
          image: item.image || product?.images?.[0],
          size: size,
          design: design
        };
        
        return mappedItem;
      }),
      subtotal,
      shipping,
      totalAmount,
      itemsCount,
      status: "pending",
      paymentStatus: paymentStatus || "unpaid",
      paymentMethod: paymentMethod || undefined,
    };

    // Log checkout data for debugging
    console.log('Checkout Data:', JSON.stringify(checkoutData, null, 2));

    // Save checkout and clear cart
    const checkout = new Checkout(checkoutData);
    const savedCheckout = await checkout.save();

    await Cart.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(cartId), customerId: user._id },
      { $set: { items: [] } },
      { new: true }
    );

    // Format response
    const responseData: ApiResponse<ICheckout> = {
      error: false,
      message: "Checkout created successfully",
      data: {
        ...savedCheckout.toObject(),
        _id: savedCheckout._id.toString(),
        customerId: savedCheckout.customerId.toString(),
        cartId: savedCheckout.cartId.toString(),
        shippingDetails: {
          ...savedCheckout.shippingDetails,
          countryId: savedCheckout.shippingDetails.countryId.toString(),
          provinceId: savedCheckout.shippingDetails.provinceId.toString(),
          cityId: savedCheckout.shippingDetails.cityId.toString(),
        },
      },
    };

    // Before returning success response
    console.log('Checkout Success Response:', {
      checkoutId: savedCheckout._id,
      status: savedCheckout.status,
      totalAmount: savedCheckout.totalAmount,
      itemsWithDesign: savedCheckout.items.filter((item: CartItem) => item.design).length
    });

    return NextResponse.json(responseData, { status: 201 });
  } catch (error: unknown) {
    console.error("Checkout Error:", error);
    
    // Improved error handling
    let message = "Failed to create checkout";
    let details = error instanceof Error ? error.message : "Unknown error details";
    let status = 500;

    if (error instanceof mongoose.Error.ValidationError) {
      message = "Checkout validation failed";
      details = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      status = 400;
    } else if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes("city not found")) {
        message = "City not found or is inactive.";
        status = 404;
      } else if (errorMsg.includes("cart not found")) {
        message = "Cart not found";
        status = 404;
      } else if (
        errorMsg.includes("empty cart") ||
        errorMsg.includes("no valid items") ||
        errorMsg.includes("insufficient stock") ||
        errorMsg.includes("failed to update stock")
      ) {
        // Extract product name if available
        const productName = errorMsg.split("for")[1]?.trim() || "product";
        message = `Sorry, "${productName}" is out of stock or has insufficient quantity. Please update your cart.`;
        status = 400;
      }
    }

    return NextResponse.json({ error: true, message, details } as ApiResponse, { status });
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
          { error: true, message: "Unauthorized" } as ApiResponse,
          { status: 401 }
        )
      );
    }
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    // Build the query object
    const query: mongoose.FilterQuery<ICheckout> = {};
    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      // Fix: Handle _id separately - check if it might be an ObjectId
      try {
        // Check if search looks like a valid ObjectId (24 hex chars)
        const isValidObjectIdFormat = /^[0-9a-fA-F]{24}$/.test(search);

        if (isValidObjectIdFormat) {
          // If search might be an ObjectId, use it directly for _id search
          query.$or = [
            { _id: search }, // Direct equality check for ObjectId
            { "shippingDetails.fullName": { $regex: search, $options: "i" } },
            { "shippingDetails.email": { $regex: search, $options: "i" } },
          ];
        } else {
          // If search isn't ObjectId format, only search string fields
          query.$or = [
            { "shippingDetails.fullName": { $regex: search, $options: "i" } },
            { "shippingDetails.email": { $regex: search, $options: "i" } },
          ];
        }
      } catch (error) {
        console.error(error);
        query.$or = [
          { "shippingDetails.fullName": { $regex: search, $options: "i" } },
          { "shippingDetails.email": { $regex: search, $options: "i" } },
        ];
      }
    }

    // Count total documents matching the query
    const total = await Checkout.countDocuments(query);

    // Fetch orders with the query, sorted by createdAt (descending)
    const checkouts = await Checkout.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Sanitize the response data
    const sanitizedCheckouts = checkouts.map((checkout) => ({
      id: checkout._id?.toString() || "",
      customerId: checkout.customerId?.toString() || "",
      cartDetails: {
        id: checkout.cartId?.toString() || "",
        items: checkout.items || [],
      },
      shippingDetails: {
        fullName: checkout.shippingDetails?.fullName || "",
        email: checkout.shippingDetails?.email || "",
        phone: checkout.shippingDetails?.phone || "",
        address: checkout.shippingDetails?.address || "",
        countryId: checkout.shippingDetails?.countryId?.toString() || "",
        provinceId: checkout.shippingDetails?.provinceId?.toString() || "",
        cityId: checkout.shippingDetails?.cityId?.toString() || "",
        postalCode: checkout.shippingDetails?.postalCode || "",
        locationUrl: checkout.shippingDetails?.locationUrl || "",
      },
      subtotal: checkout.subtotal || 0,
      shipping: checkout.shipping || 0,
      totalAmount: checkout.totalAmount || 0,
      itemsCount: checkout.itemsCount || 0,
      status: checkout.status || "pending",
      paymentStatus: checkout.paymentStatus || "unpaid",
      paymentMethod: checkout.paymentMethod || null,
      createdAt: checkout.createdAt || new Date(),
      updatedAt: checkout.updatedAt || new Date(),
    }));

    const responseData: ApiResponse<{
      checkouts: typeof sanitizedCheckouts;
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Checkouts retrieved successfully",
      data: {
        checkouts: sanitizedCheckouts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: unknown) {
    console.error("Get Checkouts Error:", error);
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