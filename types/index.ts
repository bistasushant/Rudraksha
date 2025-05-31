import { Types, Document } from "mongoose";

export type AdminRole = "admin" | "editor" | "user";
export type CustomerRole = "customer";
export type UserRole = AdminRole | CustomerRole;

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  contactNumber: string;
  image?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  image: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
  contactNumber?: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangeImageRequest {
  newImage: string;
}

export interface CustomerApiResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  error: boolean;
  message?: string;
  data?: T;
  details?: string;
}

export interface LoginResponseData {
  token: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  contactNumber?: string;
  _id: string;
}

export interface RegisterResponseData {
  email: string;
  name: string;
  role: UserRole;
  contactNumber?: string;
}

export interface IProduct {
  _id?: Types.ObjectId;
  id?: string;
  slug: string;
  name: string;
  category: Types.ObjectId[] | string[];
  subcategory: Types.ObjectId[] | string[];
  price: number;
  stock: number;
  description: string;
  benefit: string;
  images?: string[];
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddProductRequest {
  name: string;
  slug?: string;
  category: string[];
  subcategory: string[];
  price: number;
  stock: number;
  description: string;
  benefit: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  images?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  category?: string[];
  subcategory?: string[];
  price?: number;
  stock?: number;
  description?: string;
  benefit?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  images?: string[];
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive?: boolean;
}
export interface ISubCategory {
  id: string;
  name: string;
  slug: string;
  category: Types.ObjectId[] | string[];
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface AddSubCategoryRequest {
  name: string;
  slug: string;
  category: string[];
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive: boolean;
}
export interface UpdateSubCategoryRequest {
  name?: string;
  slug?: string;
  category?: string[];
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive?: string;
}

export interface PaginationRequest {
  page: number;
  limit: number;
}

export interface PaginationResponse<T> {
  error: boolean;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
  message?: string;
}

export interface ApiResponse<T = any> {
  error: boolean;
  message?: string;
  data?: T;
  details?: string;
}

export interface IBlog {
  id?: string;
  slug: string;
  name: string;
  heading: string;
  category: Types.ObjectId[] | string[];
  description: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddBlogRequest {
  name: string;
  slug?: string;
  heading: string;
  category: string[];
  description: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  image: string;
}

export interface UpdateBlogRequest {
  name?: string;
  slug?: string;
  heading?: string;
  category?: string[];
  description?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  image?: string;
}

export interface ILogo {
  url: string;
  createdAt?: Date;
}

export interface ITitle {
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGoogleAnalytics {
  trackingId: string;
  updatedAt?: Date;
}

export interface ICurrency {
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHero {
  title: string;
  subtitle: string;
  videoUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Plain type for lean() results
export interface PlainSettings {
  _id?: Types.ObjectId;
  googleAnalytics?: IGoogleAnalytics;
  logo?: ILogo;
  currency?: ICurrency;
  title?: ITitle;
  hero?: IHero;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

// Mongoose Document type
export interface ISettings extends Document {
  googleAnalytics?: IGoogleAnalytics;
  logo?: ILogo;
  currency?: ICurrency;
  title?: ITitle;
  hero?: IHero;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateSettingsRequest {
  googleAnalytics?: { trackingId: string };
  logo?: { url: string };
  currency?: { currency: string };
  title?: { title: string };
  hero?: { title: string; subtitle: string; videoUrl: string };

}

export interface SettingsResponseData {
  googleAnalytics?: IGoogleAnalytics;
  logo?: ILogo;
  currency?: ICurrency;
  title?: ITitle;
  hero?: IHero;

}

export interface IContact {
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl?: string;
}

export interface IAbout {
  title: string;
  description: string;
  imageUrl: string;
}

export interface CustomerLoginResponseData {
  token: string;
  email: string;
  name: string;
  image?: string;
  contactNumber: string;
  role: CustomerRole;
}

export interface CustomerRegisterResponseData {
  email: string;
  name: string;
  contactNumber: string;
  role: CustomerRole;
}

export interface CustomerLoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  contactNumber: string;
  image?: string;
}

export interface IBlogcategory {
  id?: string;
  slug: string;
  name: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddBlogCategoryRequest {
  name: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

export interface UpdateBlogCategoryRequest {
  name?: string;
  slug?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface CartItem {
  productId: Types.ObjectId;
  name: string;
  image?: string;
  price: number;
  quantity: number;
}

export interface ICart extends Document {
  customerId?: Types.ObjectId;
  sessionId?: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutRequest {
  customerId: string;
  cartId: string;
  shippingDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    countryId: string;
    provinceId: string;
    cityId: string;
    postalCode?: string;
    locationUrl?: string;
  };
  paymentStatus?: "paid" | "unpaid";
  paymentMethod?: string;
}

export interface ICheckout extends Document {
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
  status:
  | "pending"
  | "confirm"
  | "processing"
  | "pickup"
  | "on the way"
  | "completed"
  | "cancelled";
  paymentStatus: "paid" | "unpaid";
  paymentMethod?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICountryResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface UpdateCountryRequest {
  id?: string;
  name?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IProvinceResponse {
  id: string;
  name: string;
  countryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface AddProvinceRequest {
  name: string;
  countryId: Types.ObjectId;
  isActive?: boolean;
}
export interface UpdateProvinceRequest {
  name?: string;
  countryId?: string;
  isActive?: boolean;
}

export interface IProvinceDocument {
  _id: Types.ObjectId;
  name: string;
  countryId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface ICityResponse {
  id: string;
  name: string;
  provinceId: string;
  shippingCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface AddCityRequest {
  name: string;
  provinceId: Types.ObjectId;
  shippingCost: number;
  isActive?: boolean;
}
export interface UpdateCityRequest {
  name?: string;
  provinceId?: string;
  shippingCost?: number;
  isActive?: boolean;
}

export interface ICityDocument {
  _id: Types.ObjectId;
  name: string;
  provinceId: Types.ObjectId;
  shippingCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestimonial {
  id: string;
  fullName: string;
  slug: string;
  address: string;
  rating: number;
  description: string;
  image: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface AddTestimonialRequest {
  fullName: string;
  slug: string;
  address: string;
  rating: number;
  description: string;
  image: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}
export interface UpdateTestimonialRequest {
  fullName?: string;
  slug?: string;
  address?: string;
  rating?: number;
  description?: string;
  image?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive?: boolean;
}

export interface IWishlistItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productStock: number;
  productImage: string;
  createdAt?: Date;
}

export interface IWishlistItem extends Document {
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productStock: number;
  productImage: string;
  createdAt?: Date;
}



