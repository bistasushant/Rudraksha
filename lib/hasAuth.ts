// import { NextRequest, NextResponse } from "next/server";
// import jwt from "jsonwebtoken";
// import { connectDB } from "@/lib/mongodb";
// import { getToken } from "./auth";
// import User from "@/models/User";
// import { ApiResponse, UserRole } from "@/types";

// export async function hasAuth(req: NextRequest) {
//   await connectDB();

//   const token = getToken(req);
//   if (!token) {
//     return {
//       user: null,
//       response: NextResponse.json(
//         {
//           error: true,
//           message: "Unauthorized: No token provided",
//         } as ApiResponse,
//         { status: 401 }
//       ),
//     };
//   }

//   try {
//     // Try to decode the token without verification first to determine which secret to use
//     const decodedPayload = jwt.decode(token) as {
//       email?: string;
//       role?: string;
//     } | null;

//     if (!decodedPayload) {
//       throw new Error("Invalid token format");
//     }

//     // Select the correct secret based on the role in the token
//     const secret =
//       decodedPayload.role === "customer"
//         ? process.env.CUSTOMER_JWT_SECRET
//         : process.env.JWT_SECRET;

//     if (!secret) {
//       throw new Error("JWT secret not configured");
//     }

//     // Now verify with the appropriate secret
//     const decoded = jwt.verify(token, secret) as {
//       email: string;
//       role: UserRole;
//     };

//     const user = await User.findOne({ email: decoded.email }).select(
//       "-password"
//     );
//     if (!user) {
//       return {
//         user: null,
//         response: NextResponse.json(
//           {
//             error: true,
//             message: "Unauthorized: User not found",
//           } as ApiResponse,
//           { status: 401 }
//         ),
//       };
//     }

//     return {
//       user,
//       response: null,
//     };
//   } catch (error) {
//     console.error("Error verifying token:", error);
//     return {
//       user: null,
//       response: NextResponse.json(
//         { error: true, message: "Unauthorized: Invalid token" } as ApiResponse,
//         { status: 401 }
//       ),
//     };
//   }
// }
