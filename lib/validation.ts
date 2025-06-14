import Joi from "joi";
import {
  AddBlogRequest,
  AddCategoryRequest,
  AddProductRequest,
  ChangeEmailRequest,
  ChangePasswordRequest,
  ChangeImageRequest,
  LoginRequest,
  RegisterRequest,
  UpdateCategoryRequest,
  RegisterCustomerRequest,
  AddBlogCategoryRequest,
  UpdateBlogCategoryRequest,
  UpdateBlogRequest,
  UserRole,
  AddSubCategoryRequest,
  UpdateSubCategoryRequest,
  ICountryResponse,
  UpdateCountryRequest,
  AddProvinceRequest,
  UpdateProvinceRequest,
  AddCityRequest,
  UpdateCityRequest,
  AddTestimonialRequest,
  UpdateTestimonialRequest,
  AddFaqRequest,
  UpdateFaqRequest,
  AddBenefitRequest,
  UpdateBenefitRequest,
  AddBannerRequest,
  AddPackageRequest,
  AddDesignRequest,
  AddSizeRequest,
  UpdateSizeRequest,
} from "@/types";
import sanitizeHtml from "sanitize-html";
import { isValidObjectId } from "mongoose";

// Role hierarchy definition
const ROLES_HIERARCHY: UserRole[] = ["user", "editor", "admin", "customer"];

export const validateRole = (role: string, requiredRole: UserRole): boolean => {
  const userRoleIndex = ROLES_HIERARCHY.indexOf(role.toLowerCase() as UserRole);
  const requiredRoleIndex = ROLES_HIERARCHY.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex && userRoleIndex !== -1;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return passwordRegex.test(password);
};

export const validateName = (name: string): boolean => {
  return typeof name === "string" && name.trim().length > 0;
};

export function validateImage(image: string): boolean {
  if (!image || typeof image !== "string") {
    return false;
  }
  const urlPattern = /^(https?:\/\/)/i;
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/i;
  const relativePathPattern = /^\//;
  return (
    urlPattern.test(image) ||
    base64Pattern.test(image) ||
    relativePathPattern.test(image)
  );
}
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

export function sanitizeInput(input: string) {
  return sanitizeHtml(input, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "p",
      "a",
      "ul",
      "ol",
      "nl",
      "li",
      "b",
      "i",
      "strong",
      "em",
      "strike",
      "code",
      "hr",
      "br",
      "div",
      "table",
      "thead",
      "caption",
      "tbody",
      "tr",
      "th",
      "td",
      "pre",
      "img",
      "span",
      "u",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "height", "width"],
      "*": ["class", "style"],
    },
    allowedSchemes: ["http", "https"], // Default schemes for most tags
    allowedSchemesByTag: {
      img: ["http", "https", "data"], // Allow data URLs for img src
    },
    allowedStyles: {
      "*": {
        color: [
          /^#(0x)?[0-9a-f]+$/i,
          /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
        ],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-size": [/^\d+(?:px|em|rem|%)$/],
        "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
        "text-decoration": [/^underline$/, /^line-through$/],
        "font-style": [/^italic$/, /^normal$/],
        padding: [/^\d+(?:px|em|rem|%)$/],
        margin: [/^\d+(?:px|em|rem|%)$/],
        "font-family": [/^['"]?[a-zA-Z0-9\s\-_,]+['"]?$/i],
      },
    },
  });
}

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Authentication requests (no role needed)
export const validateLoginRequest = (data: unknown): data is LoginRequest => {
  if (!data || typeof data !== "object") return false;
  const loginData = data as Partial<LoginRequest>;
  return (
    typeof loginData.email === "string" &&
    typeof loginData.password === "string" &&
    validateEmail(loginData.email)
  );
};

export const validateRegisterRequest = (
  data: unknown
): data is RegisterRequest => {
  if (!data || typeof data !== "object") return false;
  const registerData = data as Partial<RegisterRequest>;
  return (
    typeof registerData.email === "string" &&
    typeof registerData.name === "string" &&
    typeof registerData.password === "string" &&
    typeof registerData.confirmPassword === "string" &&
    typeof registerData.role === "string" &&
    ["admin", "editor", "user", "customer"].includes(registerData.role) &&
    validateEmail(registerData.email) &&
    validateName(registerData.name) &&
    validatePassword(registerData.password) &&
    registerData.password === registerData.confirmPassword &&
    (registerData.role !== "customer" ||
      (typeof registerData.contactNumber === "string" &&
        registerData.contactNumber.trim().length > 0))
  );
};

export const validateChangeEmailRequest = (
  data: unknown
): data is ChangeEmailRequest => {
  if (!data || typeof data !== "object") return false;
  const emailData = data as Partial<ChangeEmailRequest>;
  return (
    typeof emailData.newEmail === "string" && validateEmail(emailData.newEmail)
  );
};

export const validateChangePasswordRequest = (
  data: unknown,
  role: string
): data is ChangePasswordRequest => {
  if (!validateRole(role, "user")) return false;
  if (!data || typeof data !== "object") return false;
  const passwordData = data as Partial<ChangePasswordRequest>;
  return (
    typeof passwordData.oldPassword === "string" &&
    typeof passwordData.newPassword === "string" &&
    validatePassword(passwordData.newPassword)
  );
};

export const validateChangeImageRequest = (
  data: unknown,
  role: string
): data is ChangeImageRequest => {
  if (!validateRole(role, "user")) return false;
  if (!data || typeof data !== "object") return false;
  const imageData = data as Partial<ChangeImageRequest>;
  return (
    typeof imageData.newImage === "string" && validateImage(imageData.newImage)
  );
};

export const validateImageRequest = (
  data: unknown
): data is { image: string } => {
  if (!data || typeof data !== "object") return false;
  const imageData = data as { image: string };
  return typeof imageData.image === "string" && validateImage(imageData.image);
};

// Product management
export const validateAddProductRequest = (
  data: unknown,
  role: string
): data is AddProductRequest => {
  if (!validateRole(role, "admin")) return false;
  if (!data || typeof data !== "object") return false;

  const product = data as AddProductRequest;

  return (
    typeof product.name === "string" &&
    product.name.trim().length > 0 &&
    Array.isArray(product.category) &&
    product.category.length > 0 &&
    product.category.every((cat) => typeof cat === "string") &&
    (!product.subcategory || (Array.isArray(product.subcategory) && product.subcategory.every((sub) => typeof sub === "string"))) &&
    typeof product.price === "number" &&
    product.price >= 0 &&
    typeof product.stock === "number" &&
    product.stock >= 0 &&
    typeof product.description === "string" &&
    product.description.trim().length > 0 &&
    typeof product.benefit === "string" &&
    product.benefit.trim().length > 0 &&
    typeof product.feature === "boolean" &&
    Array.isArray(product.sizes) &&
    product.sizes.length > 0 &&
    product.sizes.every(
      (size: { size?: string; sizeId?: string; price: number }) => {
        // Check if it's a static small size
        if (size.size !== undefined) {
          return size.size === 'small' && 
                 typeof size.price === 'number' && 
                 size.price >= 0;
        }
        // Check if it's a regular size with sizeId
        return typeof size.sizeId === 'string' && 
               typeof size.price === 'number' && 
               size.price >= 0;
      }
    ) &&
    (!product.designs || (Array.isArray(product.designs) && 
      product.designs.every(
        (design) =>
          typeof design.title === "string" &&
          typeof design.price === "number" &&
          design.price >= 0 &&
          typeof design.image === "string"
      )
    )) &&
    (!product.seoTitle || typeof product.seoTitle === "string") &&
    (!product.metaDescription || typeof product.metaDescription === "string") &&
    (!product.metaKeywords || typeof product.metaKeywords === "string") &&
    (!product.images || (Array.isArray(product.images) && product.images.every((img) => typeof img === "string")))
  );
};

export function validateUpdateProductRequest(
  productData: Partial<AddProductRequest>,
  role: string
): boolean {
  // Check role - allow both admin and editor
  if (!["admin", "editor"].includes(role)) return false;

  // Check if at least one field is provided
  if (Object.keys(productData).length === 0) {
    console.error("No fields provided for update");
    return false;
  }

  // Validate each field if it exists
  if (productData.name !== undefined && typeof productData.name !== "string") {
    console.error("Invalid name type");
    return false;
  }

  if (productData.category !== undefined) {
    if (!Array.isArray(productData.category)) {
      console.error("Category must be an array");
      return false;
    }
    if (!productData.category.every((id) => typeof id === "string")) {
      console.error("Invalid category ID type");
      return false;
    }
  }

  if (productData.subcategory !== undefined) {
    if (!Array.isArray(productData.subcategory)) {
      console.error("Subcategory must be an array");
      return false;
    }
    if (!productData.subcategory.every((id) => typeof id === "string")) {
      console.error("Invalid subcategory ID type");
      return false;
    }
  }

  if (productData.sizes !== undefined) {
    if (!Array.isArray(productData.sizes)) {
      console.error("Sizes must be an array");
      return false;
    }
    if (!productData.sizes.every((size) => {
      const hasValidSizeId = 'sizeId' in size && typeof size.sizeId === 'string';
      const hasValidPrice = typeof size.price === 'number' && size.price >= 0;
      return hasValidSizeId && hasValidPrice;
    })) {
      console.error("Invalid size format");
      return false;
    }
  }

  if (productData.price !== undefined && (typeof productData.price !== "number" || productData.price < 0)) {
    console.error("Invalid price");
    return false;
  }

  if (productData.stock !== undefined && (typeof productData.stock !== "number" || productData.stock < 0)) {
    console.error("Invalid stock");
    return false;
  }

  if (productData.description !== undefined && typeof productData.description !== "string") {
    console.error("Invalid description type");
    return false;
  }

  if (productData.benefit !== undefined && typeof productData.benefit !== "string") {
    console.error("Invalid benefit type");
    return false;
  }

  if (productData.feature !== undefined && typeof productData.feature !== "boolean") {
    console.error("Invalid feature type");
    return false;
  }

  if (productData.designs !== undefined) {
    if (!Array.isArray(productData.designs)) {
      console.error("Designs must be an array");
      return false;
    }
    if (productData.designs.length > 0) {
      if (!productData.designs.every((design) => {
        return (
          typeof design.title === "string" &&
          typeof design.price === "number" &&
          design.price >= 0 &&
          typeof design.image === "string"
        );
      })) {
        console.error("Invalid design format");
        return false;
      }
    }
  }

  if (productData.images !== undefined) {
    if (!Array.isArray(productData.images)) {
      console.error("Images must be an array");
      return false;
    }
    if (!productData.images.every((img) => typeof img === "string")) {
      console.error("Invalid image format");
      return false;
    }
  }

  return true;
}

// Category management
export const validateAddCategoryRequest = (
  data: unknown,
  role: string
): data is AddCategoryRequest => {
  // RBAC: Only admin and editor can add categories
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const categoryData = data as Partial<AddCategoryRequest>;
  return (
    typeof categoryData.name === "string" &&
    validateName(categoryData.name) &&
    typeof categoryData.slug === "string" &&
    validateSlug(categoryData.slug) &&
    (categoryData.description === undefined ||
      typeof categoryData.description === "string") &&
    (categoryData.benefit === undefined ||
      typeof categoryData.benefit === "string") &&
    (categoryData.seoTitle === undefined ||
      typeof categoryData.seoTitle === "string") &&
    (categoryData.metaDescription === undefined ||
      typeof categoryData.metaDescription === "string") &&
    (categoryData.metaKeywords === undefined ||
      typeof categoryData.metaKeywords === "string") &&
    (categoryData.isActive === undefined ||
      typeof categoryData.isActive === "boolean") &&
    typeof categoryData.image === "string" &&
    validateImage(categoryData.image)
  );
};

export const validateUpdateCategoryRequest = (
  data: unknown,
  role: string
): data is UpdateCategoryRequest => {
  // RBAC: Only admin and editor can update categories
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const categoryData = data as Partial<UpdateCategoryRequest>;

  if (
    categoryData.image === undefined &&
    categoryData.name === undefined &&
    categoryData.slug === undefined &&
    categoryData.description === undefined &&
    categoryData.benefit === undefined &&
    categoryData.seoTitle === undefined &&
    categoryData.metaDescription == undefined &&
    categoryData.metaKeywords === undefined &&
    categoryData.isActive === undefined
  ) {
    return false; // At least one field must be provided
  }

  return (
    (categoryData.image === undefined ||
      (typeof categoryData.image === "string" &&
        validateImage(categoryData.image))) &&
    (categoryData.name === undefined ||
      (typeof categoryData.name === "string" &&
        validateName(categoryData.name))) &&
    (categoryData.slug === undefined ||
      (typeof categoryData.slug === "string" &&
        validateSlug(categoryData.slug))) &&
    (categoryData.description === undefined ||
      typeof categoryData.description === "string") &&
    (categoryData.benefit === undefined ||
      typeof categoryData.benefit === "string") &&
    (categoryData.seoTitle === undefined ||
      typeof categoryData.seoTitle === "string") &&
    (categoryData.metaDescription === undefined ||
      typeof categoryData.metaDescription === "string") &&
    (categoryData.metaKeywords === undefined ||
      typeof categoryData.metaKeywords === "string") &&
    (categoryData.isActive === undefined ||
      typeof categoryData.isActive === "boolean")
  );
};

//product sub category
export const validateAddProductSubCategoryRequest = (
  data: unknown,
  role: string
): data is AddSubCategoryRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const subCategoryData = data as Partial<AddSubCategoryRequest>;
  return (
    typeof subCategoryData.name === "string" &&
    validateName(subCategoryData.name) &&
    typeof subCategoryData.slug === "string" &&
    validateSlug(subCategoryData.slug) &&
    Array.isArray(subCategoryData.category) &&
    subCategoryData.category.every((cat) => typeof cat === "string") &&
    (subCategoryData.seoTitle === undefined ||
      typeof subCategoryData.seoTitle === "string") &&
    (subCategoryData.metaDescription === undefined ||
      typeof subCategoryData.metaDescription === "string") &&
    (subCategoryData.metaKeywords === undefined ||
      typeof subCategoryData.metaKeywords === "string") &&
    (subCategoryData.isActive === undefined ||
      typeof subCategoryData.isActive === "boolean")
  );
};

export const validateUpdateSubCategoryRequest = (
  data: unknown,
  role: string
): data is UpdateSubCategoryRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const subCategoryData = data as Partial<UpdateSubCategoryRequest>;

  if (
    subCategoryData.name === undefined &&
    subCategoryData.slug === undefined &&
    subCategoryData.category === undefined &&
    subCategoryData.seoTitle === undefined &&
    subCategoryData.metaDescription === undefined &&
    subCategoryData.metaKeywords === undefined &&
    subCategoryData.isActive === undefined
  ) {
    return false;
  }
  return (
    (subCategoryData.name === undefined ||
      (typeof subCategoryData.name === "string" &&
        validateName(subCategoryData.name))) &&
    (subCategoryData.slug === undefined ||
      (typeof subCategoryData.slug === "string" &&
        validateSlug(subCategoryData.slug))) &&
    (subCategoryData.category === undefined ||
      (Array.isArray(subCategoryData.category) &&
        subCategoryData.category.every((cat) => typeof cat === "string"))) &&
    (subCategoryData.seoTitle === undefined ||
      typeof subCategoryData.seoTitle === "string") &&
    (subCategoryData.metaDescription === undefined ||
      typeof subCategoryData.metaDescription === "string") &&
    (subCategoryData.metaKeywords === undefined ||
      typeof subCategoryData.metaKeywords === "string") &&
    (subCategoryData.isActive === undefined ||
      typeof subCategoryData.isActive === "boolean")
  );
};

// Blog management
export const validateAddBlogRequest = (
  data: unknown,
  role: string
): data is AddBlogRequest => {
  // RBAC: Only admin and editor can add blogs
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const blogData = data as Partial<AddBlogRequest>;

  return (
    typeof blogData.name === "string" &&
    validateName(blogData.name) &&
    (blogData.slug === undefined ||
      (typeof blogData.slug === "string" && validateSlug(blogData.slug))) &&
    typeof blogData.heading === "string" &&
    blogData.heading.trim().length > 0 &&
    Array.isArray(blogData.category) &&
    blogData.category.every((cat) => typeof cat === "string") &&
    typeof blogData.description === "string" &&
    blogData.description.trim().length > 0 &&
    typeof blogData.seoTitle === "string" &&
    blogData.seoTitle.trim().length > 0 &&
    typeof blogData.metaDescription === "string" &&
    blogData.metaDescription?.trim().length > 0 &&
    typeof blogData.metaKeywords === "string" &&
    blogData.metaKeywords?.trim().length > 0 &&
    (blogData.image === undefined ||
      (typeof blogData.image === "string" && validateImage(blogData.image)))
  );
};

export const validateUpdateBlogRequest = (
  data: unknown,
  role: string
): data is UpdateBlogRequest => {
  // RBAC: Only admin and editor can update blogs
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const blogData = data as Partial<UpdateBlogRequest>;

  if (
    blogData.name === undefined &&
    blogData.slug === undefined &&
    blogData.heading === undefined &&
    blogData.category === undefined &&
    blogData.description === undefined &&
    blogData.seoTitle === undefined &&
    blogData.metaDescription === undefined &&
    blogData.metaKeywords === undefined &&
    blogData.image === undefined
  ) {
    return false; // At least one field must be provided
  }

  return (
    (blogData.name === undefined ||
      (typeof blogData.name === "string" && validateName(blogData.name))) &&
    (blogData.slug === undefined ||
      (typeof blogData.slug === "string" && validateSlug(blogData.slug))) &&
    (blogData.heading === undefined ||
      (typeof blogData.heading === "string" &&
        blogData.heading.trim().length > 0)) &&
    (blogData.category === undefined ||
      (Array.isArray(blogData.category) &&
        blogData.category.every((cat) => typeof cat === "string"))) &&
    (blogData.description === undefined ||
      (typeof blogData.description === "string" &&
        blogData.description.trim().length > 0)) &&
    (blogData.seoTitle == undefined ||
      (typeof blogData.seoTitle === "string" &&
        blogData.seoTitle.trim().length > 0)) &&
    (blogData.metaDescription == undefined ||
      (typeof blogData.metaDescription === "string" &&
        blogData.metaDescription.trim().length > 0)) &&
    (blogData.metaKeywords == undefined ||
      (typeof blogData.metaKeywords === "string" &&
        blogData.metaKeywords.trim().length > 0)) &&
    (blogData.image === undefined ||
      (typeof blogData.image === "string" && validateImage(blogData.image)))
  );
};

export const validateSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return typeof slug === "string" && slugRegex.test(slug);
};
export const validateRegisterCustomerRequest = (
  data: unknown
): data is RegisterCustomerRequest => {
  if (!data || typeof data !== "object") return false;
  const customerData = data as Partial<RegisterCustomerRequest>;

  return (
    typeof customerData.email === "string" &&
    validateEmail(customerData.email) &&
    typeof customerData.name === "string" &&
    validateName(customerData.name) &&
    typeof customerData.password === "string" &&
    validatePassword(customerData.password) &&
    typeof customerData.confirmPassword === "string" &&
    customerData.password === customerData.confirmPassword &&
    typeof customerData.contactNumber === "string" &&
    validatePhone(customerData.contactNumber) &&
    (customerData.image === undefined || validateImage(customerData.image))
  );
};

export const validateAddBlogCategoryRequest = (
  data: unknown,
  role: string
): data is AddBlogCategoryRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const blogCategoryData = data as Partial<AddBlogCategoryRequest>;

  return (
    typeof blogCategoryData.name === "string" &&
    validateName(blogCategoryData.name) &&
    typeof blogCategoryData.slug === "string" &&
    validateSlug(blogCategoryData.slug) &&
    (blogCategoryData.seoTitle === undefined ||
      typeof blogCategoryData.seoTitle === "string") &&
    (blogCategoryData.metaDescription === undefined ||
      typeof blogCategoryData.metaDescription === "string") &&
    (blogCategoryData.metaKeywords === undefined ||
      typeof blogCategoryData.metaKeywords === "string")
  );
};

export const validateUpdateBlogCategoryRequest = (
  data: unknown,
  role: string
): data is UpdateBlogCategoryRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const blogCategoryData = data as Partial<UpdateBlogCategoryRequest>;
  if (
    blogCategoryData.name === undefined &&
    blogCategoryData.slug === undefined &&
    blogCategoryData.seoTitle === undefined &&
    blogCategoryData.metaDescription === undefined &&
    blogCategoryData.metaKeywords === undefined
  ) {
    return false;
  }
  return (
    (blogCategoryData.name === undefined ||
      (typeof blogCategoryData.name === "string" &&
        validateName(blogCategoryData.name))) &&
    (blogCategoryData.slug === undefined ||
      (typeof blogCategoryData.slug === "string" &&
        validateSlug(blogCategoryData.slug))) &&
    (blogCategoryData.seoTitle === undefined ||
      typeof blogCategoryData.seoTitle === "string") &&
    (blogCategoryData.metaDescription === undefined ||
      typeof blogCategoryData.metaDescription === "string") &&
    (blogCategoryData.metaKeywords === undefined ||
      typeof blogCategoryData.metaKeywords === "string")
  );
};

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
interface ValidationResult {
  isValid: boolean;
  errors?: string[] | null;
  message?: string;
}

export function validateCheckoutRequest(data: unknown): ValidationResult {
  const shippingDetailsSchema = Joi.object({
    fullName: Joi.string().min(2).required().messages({
      "string.min": "Full name must be at least 2 characters",
      "any.required": "Full name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s-]{9,15}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Phone number must be 9-15 digits, optionally starting with +",
        "any.required": "Phone number is required",
      }),
    address: Joi.string().min(3).required().messages({
      "string.min": "Address must be at least 3 characters",
      "any.required": "Address is required",
    }),
    countryId: Joi.string().required().messages({
      "any.required": "Country ID is required",
    }),
    provinceId: Joi.string().required().messages({
      "any.required": "Province ID is required",
    }),
    cityId: Joi.string().required().messages({
      "any.required": "City ID is required",
    }),
    postalCode: Joi.string().allow("").optional(),
    locationUrl: Joi.string().uri().allow("").optional(),
  });

  const sizeSchema = Joi.object({
    size: Joi.string().required(),
    price: Joi.number().min(0).required(),
    sizeId: Joi.string().hex().length(24).allow(null, "").optional()
  }).allow(null);

  const designSchema = Joi.object({
    title: Joi.string().required(),
    price: Joi.number().min(0).required(),
    image: Joi.string().required()
  });

  const itemSchema = Joi.object({
    productId: Joi.string().hex().length(24).required(),
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().min(1).required(),
    image: Joi.string().required(),
    size: sizeSchema,
    design: designSchema
  });

  // Make items optional for the main request validation
  // since items come from the cart, not from the request body
  const schema = Joi.object({
    customerId: Joi.string().hex().length(24).required().messages({
      "string.hex": "Customer ID must be a valid ObjectId",
      "string.length": "Customer ID must be 24 characters",
      "any.required": "Customer ID is required",
    }),
    cartId: Joi.string().hex().length(24).required().messages({
      "string.hex": "Cart ID must be a valid ObjectId",
      "string.length": "Cart ID must be 24 characters",
      "any.required": "Cart ID is required",
    }),
    shippingDetails: shippingDetailsSchema,
    // Items are now optional in the request body since they come from cart
    items: Joi.array().items(itemSchema).min(1).optional().messages({
      "array.min": "At least one item is required",
    }),
    subtotal: Joi.number().min(0).optional(),
    shipping: Joi.number().min(0).optional(),
    totalAmount: Joi.number().min(0).optional(),
    itemsCount: Joi.number().min(1).optional(),
    paymentStatus: Joi.string().valid("paid", "unpaid").optional().messages({
      "string.valid": "Payment status must be 'paid' or 'unpaid'",
    }),
    paymentMethod: Joi.string().allow("", null).optional().messages({
      "string.base": "Payment method must be a string",
    }),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  if (error) {
    return {
      isValid: false,
      errors: error.details.map((err) => err.message),
    };
  }

  return {
    isValid: true,
    errors: null,
  };
}

export const validateAddCountryRequest = (
  data: unknown,
  role: string
): data is ICountryResponse => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const countryData = data as Partial<ICountryResponse>;

  return (
    typeof countryData.name === "string" &&
    validateName(countryData.name) &&
    (countryData.isActive === undefined ||
      typeof countryData.isActive === "boolean")
  );
};
export const validateUpdateCountryRequest = (
  data: unknown,
  role: string
): data is UpdateCountryRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const countryData = data as Partial<UpdateCountryRequest>;
  if (countryData.name === undefined && countryData.isActive === undefined) {
    return false;
  }
  return (
    (countryData.name === undefined ||
      (typeof countryData.name === "string" &&
        validateName(countryData.name))) &&
    (countryData.isActive === undefined ||
      typeof countryData.isActive === "boolean")
  );
};

export const validateAddProvinceRequest = (
  data: unknown,
  role: string
): data is AddProvinceRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const provinceData = data as Partial<AddProvinceRequest>;

  return (
    typeof provinceData.name === "string" &&
    validateName(provinceData.name) &&
    typeof provinceData.countryId === "string" &&
    isValidObjectId(provinceData.countryId) &&
    (provinceData.isActive === undefined ||
      typeof provinceData.isActive === "boolean")
  );
};

export const validateUpdateProvinceRequest = (
  data: unknown,
  role: string
): data is UpdateProvinceRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;

  const provinceData = data as Partial<UpdateProvinceRequest>;

  const hasValidField =
    provinceData.name !== undefined ||
    provinceData.isActive !== undefined ||
    provinceData.countryId !== undefined;

  if (!hasValidField) return false;

  return (
    (provinceData.name === undefined ||
      (typeof provinceData.name === "string" &&
        validateName(provinceData.name))) &&
    (provinceData.isActive === undefined ||
      typeof provinceData.isActive === "boolean") &&
    (provinceData.countryId === undefined ||
      (typeof provinceData.countryId === "string" &&
        isValidObjectId(provinceData.countryId)))
  );
};

export const validateAddCityRequest = (
  data: unknown,
  role: string
): data is AddCityRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const cityData = data as Partial<AddCityRequest>;

  return (
    typeof cityData.name === "string" &&
    validateName(cityData.name) &&
    typeof cityData.provinceId === "string" &&
    isValidObjectId(cityData.provinceId) &&
    typeof cityData.shippingCost === "number" &&
    cityData.shippingCost >= 0 &&
    (cityData.isActive === undefined || typeof cityData.isActive === "boolean")
  );
};

export const validateUpdateCityRequest = (
  data: unknown,
  role: string
): data is UpdateCityRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;

  const cityData = data as Partial<UpdateCityRequest>;

  const hasValidField =
    cityData.name !== undefined ||
    cityData.isActive !== undefined ||
    cityData.provinceId !== undefined ||
    cityData.shippingCost !== undefined;

  if (!hasValidField) return false;

  return (
    (cityData.name === undefined ||
      (typeof cityData.name === "string" && validateName(cityData.name))) &&
    (cityData.isActive === undefined ||
      typeof cityData.isActive === "boolean") &&
    (cityData.provinceId === undefined ||
      (typeof cityData.provinceId === "string" &&
        isValidObjectId(cityData.provinceId))) &&
    (cityData.shippingCost === undefined ||
      (typeof cityData.shippingCost === "number" && cityData.shippingCost >= 0))
  );
};

export const validateAddTestimonialRequest = (
  data: unknown,
  role: string
): ValidationResult => {
  if (!validateRole(role, "editor")) {
    return {
      isValid: false,
      message: "Forbidden: You do not have permission to add testimonials",
    };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      isValid: false,
      message: "Invalid request format: Data must be a valid object",
    };
  }

  const testimonialData = data as Partial<AddTestimonialRequest>;

  if (
    typeof testimonialData.fullName !== "string" ||
    testimonialData.fullName.trim().length < 3
  ) {
    return {
      isValid: false,
      message: "Full name must be at least 3 characters long",
    };
  }

  if (
    typeof testimonialData.address !== "string" ||
    testimonialData.address.trim().length < 3
  ) {
    return {
      isValid: false,
      message: "Address must be at least 3 characters long",
    };
  }

  // Handle rating: Convert string to number if necessary
  const rating =
    typeof testimonialData.rating === "string"
      ? parseInt(testimonialData.rating, 10)
      : testimonialData.rating;

  if (
    typeof rating !== "number" ||
    isNaN(rating) ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return {
      isValid: false,
      message: "Rating must be an integer between 1 and 5",
    };
  }

  if (
    typeof testimonialData.description !== "string" ||
    testimonialData.description.trim().length < 10
  ) {
    return {
      isValid: false,
      message: "Description must be at least 10 characters long",
    };
  }

  if (
    typeof testimonialData.image !== "string" ||
    testimonialData.image.trim().length === 0
  ) {
    return {
      isValid: false,
      message: "Image URL is required and cannot be empty",
    };
  }

  if (testimonialData.slug !== undefined) {
    if (
      typeof testimonialData.slug !== "string" ||
      testimonialData.slug.trim().length === 0
    ) {
      return {
        isValid: false,
        message: "Slug must be a non-empty string if provided",
      };
    }
  }

  if (testimonialData.seoTitle !== undefined) {
    if (
      typeof testimonialData.seoTitle !== "string" ||
      testimonialData.seoTitle.trim().length > 60
    ) {
      return {
        isValid: false,
        message: "SEO title must not exceed 60 characters",
      };
    }
  }

  if (testimonialData.metaDescription !== undefined) {
    if (
      typeof testimonialData.metaDescription !== "string" ||
      testimonialData.metaDescription.trim().length > 160
    ) {
      return {
        isValid: false,
        message: "Meta description must not exceed 160 characters",
      };
    }
  }

  if (testimonialData.metaKeywords !== undefined) {
    if (typeof testimonialData.metaKeywords !== "string") {
      return {
        isValid: false,
        message: "Meta keywords must be a string if provided",
      };
    }
  }

  return { isValid: true };
};

export const validateUpdateTestimonialRequest = (
  data: unknown,
  role: string
): boolean => {
  // RBAC: Only admin and editor can update testimonials
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const testimonialData = data as Partial<UpdateTestimonialRequest>;

  // Check if at least one field is being updated
  if (
    testimonialData.fullName === undefined &&
    testimonialData.slug === undefined &&
    testimonialData.address === undefined &&
    testimonialData.rating === undefined &&
    testimonialData.description === undefined &&
    testimonialData.seoTitle === undefined &&
    testimonialData.metaDescription === undefined &&
    testimonialData.metaKeywords === undefined &&
    testimonialData.image === undefined
  ) {
    return false;
  }

  // Validate each field that is present
  return (
    (testimonialData.fullName === undefined ||
      (typeof testimonialData.fullName === "string" &&
        testimonialData.fullName.trim().length >= 3)) &&
    (testimonialData.slug === undefined ||
      (typeof testimonialData.slug === "string" &&
        testimonialData.slug.trim().length > 0)) &&
    (testimonialData.address === undefined ||
      (typeof testimonialData.address === "string" &&
        testimonialData.address.trim().length >= 3)) &&
    (testimonialData.rating === undefined ||
      (typeof testimonialData.rating === "number" &&
        Number.isInteger(testimonialData.rating) &&
        testimonialData.rating >= 1 &&
        testimonialData.rating <= 5)) &&
    (testimonialData.description === undefined ||
      (typeof testimonialData.description === "string" &&
        testimonialData.description.trim().length >= 10)) &&
    (testimonialData.seoTitle === undefined ||
      (typeof testimonialData.seoTitle === "string" &&
        testimonialData.seoTitle.trim().length <= 60)) &&
    (testimonialData.metaDescription === undefined ||
      (typeof testimonialData.metaDescription === "string" &&
        testimonialData.metaDescription.trim().length <= 160)) &&
    (testimonialData.metaKeywords === undefined ||
      typeof testimonialData.metaKeywords === "string") &&
    (testimonialData.image === undefined ||
      (typeof testimonialData.image === "string" &&
        testimonialData.image.length > 0))
  );
};

export const validateAddFaqRequest = (
  data: unknown,
  role: string
): data is AddFaqRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const faqData = data as Partial<AddFaqRequest>;

  return (
    typeof faqData.question === "string" &&
    validateName(faqData.question) &&
    (faqData.slug === undefined ||
      (typeof faqData.slug === "string" && validateSlug(faqData.slug))) &&
    typeof faqData.answer === "string" &&
    validateName(faqData.answer) &&
    (faqData.seoTitle === undefined ||
      (typeof faqData.seoTitle === "string" &&
        faqData.seoTitle.trim().length > 0)) &&
    (faqData.metaDescription === undefined ||
      typeof faqData.metaDescription === "string") &&
    (faqData.metaKeywords === undefined ||
      typeof faqData.metaKeywords === "string")
  );
};

export const validateUpdateFaqRequest = (
  data: unknown,
  role: string
): data is UpdateFaqRequest => {
  // RBAC: Only admin and editor can update blogs
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const faqData = data as Partial<UpdateFaqRequest>;

  if (
    faqData.question === undefined &&
    faqData.slug === undefined &&
    faqData.answer === undefined &&
    faqData.seoTitle === undefined &&
    faqData.metaDescription === undefined &&
    faqData.metaKeywords === undefined
  ) {
    return false;
  }

  return (
    (faqData.question === undefined ||
      (typeof faqData.question === "string" &&
        validateName(faqData.question))) &&
    (faqData.slug === undefined ||
      (typeof faqData.slug === "string" && validateSlug(faqData.slug))) &&
    (faqData.answer === undefined ||
      (typeof faqData.answer === "string" && validateName(faqData.answer))) &&
    (faqData.seoTitle === undefined || typeof faqData.seoTitle === "string") &&
    (faqData.metaDescription === undefined ||
      typeof faqData.metaDescription === "string") &&
    (faqData.metaKeywords === undefined ||
      typeof faqData.metaKeywords === "string")
  );
};

export const validateAddBenefitRequest = (
  data: unknown,
  role: string
): data is AddBenefitRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const benefitData = data as Partial<AddBenefitRequest>;

  return (
    typeof benefitData.title === "string" &&
    validateName(benefitData.title) &&
    (benefitData.slug === undefined ||
      (typeof benefitData.slug === "string" &&
        validateSlug(benefitData.slug))) &&
    typeof benefitData.description === "string" &&
    validateName(benefitData.description) &&
    (benefitData.seoTitle === undefined ||
      typeof benefitData.seoTitle === "string") &&
    (benefitData.metaDescription === undefined ||
      typeof benefitData.metaDescription === "string") &&
    (benefitData.metaKeywords === undefined ||
      typeof benefitData.metaKeywords === "string")
  );
};

export const validateUpdateBenefitRequest = (
  data: unknown,
  role: string
): data is UpdateBenefitRequest => {
  // RBAC: Only admin and editor can update blogs
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const benefitData = data as Partial<UpdateBenefitRequest>;

  if (
    benefitData.title === undefined &&
    benefitData.slug === undefined &&
    benefitData.description === undefined &&
    benefitData.seoTitle === undefined &&
    benefitData.metaDescription === undefined &&
    benefitData.metaKeywords === undefined
  ) {
    return false;
  }

  return (
    (benefitData.title === undefined ||
      (typeof benefitData.title === "string" &&
        validateName(benefitData.title))) &&
    (benefitData.slug === undefined ||
      (typeof benefitData.slug === "string" &&
        validateSlug(benefitData.slug))) &&
    (benefitData.description === undefined ||
      (typeof benefitData.description === "string" &&
        validateName(benefitData.description))) &&
    (benefitData.seoTitle === undefined ||
      typeof benefitData.seoTitle === "string") &&
    (benefitData.metaDescription === undefined ||
      typeof benefitData.metaDescription === "string") &&
    (benefitData.metaKeywords === undefined ||
      typeof benefitData.metaKeywords === "string")
  );
};

export const validateAddContentRequest = (
  data: unknown,
  role: string
): data is AddBannerRequest | AddPackageRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const contentData = data as Partial<AddBannerRequest | AddPackageRequest>;

  return (
    (contentData.type === "banner" || contentData.type === "package") &&
    typeof contentData.title === "string" &&
    validateName(contentData.title) &&
    typeof contentData.description === "string" &&
    validateName(contentData.description) &&
    (contentData.image === undefined ||
      (typeof contentData.image === "string" &&
        validateImage(contentData.image)))
  );
};

export const validateAddDesignRequest = (
  data: unknown,
  role: string
): data is AddDesignRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;

  const designData = data as Partial<AddDesignRequest>;
  return (
    typeof designData.title === "string" &&
    validateName(designData.title) &&
    typeof designData.image === "string" &&
    validateImage(designData.image) &&
    (typeof designData.price === "number" ||
      (typeof designData.price === "string" &&
        !isNaN(Number(designData.price)))) &&
    Number(designData.price) >= 0
  );
};

export const validateUpdateDesignRequest = (
  data: unknown,
  role: string
): data is Partial<AddDesignRequest & { productId?: string }> => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;

  const designData = data as Partial<AddDesignRequest & { productId?: string }>;

  // At least one field should be provided for update
  if (
    designData.title === undefined &&
    designData.image === undefined &&
    designData.price === undefined &&
    designData.productId === undefined
  ) {
    return false;
  }

  return (
    (designData.title === undefined ||
      (typeof designData.title === "string" &&
        validateName(designData.title))) &&
    (designData.image === undefined ||
      (typeof designData.image === "string" &&
        validateImage(designData.image))) &&
    (designData.price === undefined ||
      (typeof designData.price === "number" &&
        !isNaN(designData.price) &&
        designData.price >= 0)) &&
    (designData.productId === undefined ||
      (typeof designData.productId === "string" &&
        designData.productId.trim().length > 0))
  );
};

export const validateAddSizeRequest = (
  data: unknown,
  role: string
): data is AddSizeRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;

  const sizeData = data as Partial<AddSizeRequest>;
  return (
    typeof sizeData.size === "string" &&
    validateName(sizeData.size) &&
    (typeof sizeData.isActive === "boolean" ||
      (typeof sizeData.isActive === "string" &&
        ((sizeData.isActive as string).toLowerCase() === "true" ||
         (sizeData.isActive as string).toLowerCase() === "false")))
  );
};

export const validateUpdateSizeRequest = (
  data: unknown,
  role: string
): data is Partial<UpdateSizeRequest> => {
  // Check role - allow both admin and editor
  if (!["admin", "editor"].includes(role)) return false;
  
  if (!data || typeof data !== "object") return false;

  const sizeData = data as Partial<UpdateSizeRequest>;

  // At least one field must be provided
  if (
    sizeData.size === undefined && 
    sizeData.isActive === undefined
  ) {
    return false;
  }

  // Validate size (if provided)
  if (sizeData.size !== undefined) {
    if (typeof sizeData.size !== "string" || sizeData.size.trim().length === 0) {
      return false;
    }
  }

  // Validate isActive (if provided) - accept both boolean and string boolean values
  if (sizeData.isActive !== undefined) {
    const isActive = sizeData.isActive;
    if (typeof isActive === "boolean") {
      // Already a boolean, that's fine
    } else if (typeof isActive === "string") {
      // Accept string boolean values
      if (isActive !== "true" && isActive !== "false") {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
};
