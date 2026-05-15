export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug?: string;
  brand?: string;
  regularPrice: number;
  salePrice?: number;
  discountPercentage?: number;
  image: string;
  images?: string[];
  thumbnails?: string[];
  inStock: boolean;
  stockCount: number;
  description?: string;
  shortDescription?: string;
  shippingInside?: number;
  shippingOutside?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

export interface Slide {
  id: number;
  title: string;
  text: string;
  btn_name: string;
  btn_href: string;
  desktop_image: string;
  mobile_image: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
}
