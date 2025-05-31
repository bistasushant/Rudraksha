import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "@/models/User";

const MONGODB_URI = process.env.MONGODB_URI || "";

// Validate MONGODB_URI
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in environment variable");
}

// Database connection function
export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    // console.log("Connected to MongoDB");

    const existingAdminWithRole = await User.findOne({ role: "admin" });

    if (!existingAdminWithRole) {
      const emailExists = await User.findOne({ email: "admin@gmail.com" });

      if (!emailExists) {
        const plainPassword = "Admin@123";
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        // console.log("Generated Hash for Admin@123:", hashedPassword);

        const defaultAdmin = new User({
          email: "admin@gmail.com",
          password: hashedPassword, // Store the hashed password
          contactNumber: "",
          image: "",
          name: "Admin",
          role: "admin",
        });

        // Save without triggering pre-save middleware
        await defaultAdmin.save({ validateBeforeSave: false });
        // console.log("Default admin created with email: admin@gmail.com");
      } else {
        console.log(
          "Email admin@gmail.com already exists in database with a different role"
        );
      }
    }
  } catch (error) {
    console.error("Error connecting to the database or creating admin:", error);
    throw error;
  }
};
