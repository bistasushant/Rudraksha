// apiHelper.ts
import { getRequest } from "@/helpers/requestHelper";

// Function to get category information
export const getCategoryInfo = async () => {
  return await getRequest("/category");
};

// Function to get product information
export const getProductInfo = async () => {
  return await getRequest("/products");
};
