import { IContact } from "@/types";
import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema<IContact>({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  mapEmbedUrl: { type: String, default: "" },
});

export default mongoose.models.Contact ||
  mongoose.model<IContact>("Contact", contactSchema);
