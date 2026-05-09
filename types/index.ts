export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand?: string;
  regularPrice: number;
  salePrice?: number;
  discountPercentage?: number;
  image: string;
  thumbnails?: string[];
  inStock: boolean;
  stockCount: number;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}
