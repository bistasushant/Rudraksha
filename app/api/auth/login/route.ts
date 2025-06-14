import { comparePassword, generateToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateLoginRequest } from "@/lib/validation";
import User from "@/models/User";
import { ApiResponse, LoginResponseData } from "@/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!validateLoginRequest(body)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid request format. Email and password are required",
        },
        { status: 400 }
      );
    }

    const { email, password } = body;
    const sanitizedEmail = sanitizeInput(email);

    const user = await User.findOne({ email: sanitizedEmail }).select(
      "email name password contactNumber image role"
    );

    if (!user) {
      return NextResponse.json(
        { error: true, message: "Incorrect email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: true, message: "Incorrect email or password" },
        { status: 401 }
      );
    }

    const token = generateToken(user.email, user.role);

    const responseData: ApiResponse<LoginResponseData> = {
      error: false,
      message: "Login successful",
      data: {
        token,
        email: user.email,
        name: user.name,
        contactNumber: user.contactNumber,
        image: user.image,
        role: user.role,
        _id: user._id.toString(), 
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
      { status: 500 }
    );
  }
}
