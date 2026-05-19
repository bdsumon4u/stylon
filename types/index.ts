export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  categories?: Array<{ id: number; name: string; slug: string }>;
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
  deliveryText?: string;
  shippingInside?: number;
  shippingOutside?: number;
  averageRating: number;
  reviewsCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
  children?: Category[];
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

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export interface MenuItem {
  id: number;
  name: string;
  href: string;
  order: number;
}

export interface Menu {
  id: number;
  name: string;
  slug: string;
  items: MenuItem[];
}

export interface ApiResponse<T> {
  data: T;
}
