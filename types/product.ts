export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  image?: string;
  images?: string[];
  category: string;
  mukhi?: number;
  benefits: string[];
  rating: number;
  reviews: number;
  stock: number;
  featured?: boolean;
  new?: boolean;
}
