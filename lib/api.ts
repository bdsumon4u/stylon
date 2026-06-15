import { unstable_cache, revalidateTag } from "next/cache";
import { Product, Category, Slide, PaginatedResponse, ApiResponse, Page, Menu } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/storefront";
export const MEDIA_BASE = API_BASE.replace('/api/storefront', '');

export function getMediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE}${path}`;
}

/**
 * Low-level fetch. POSTs and uncacheable reads bypass any caching.
 * Cacheable GETs are wrapped in `unstable_cache` so the data is shared
 * across requests and survives serverless invocations.
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { useCache?: boolean; tags?: string[]; revalidate?: number }
): Promise<T> {
  const isCacheable = options?.useCache && (!options.method || options.method === "GET");
  const url = `${API_BASE}${endpoint}`;

  const run = async () => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API Error: ${res.status}`);
    }
    return res.json() as Promise<T>;
  };

  if (isCacheable) {
    const cached = unstable_cache(
      run,
      [endpoint],
      { revalidate: options?.revalidate ?? 3600, tags: options?.tags ?? ["storefront"] }
    );
    return cached();
  }
  return run();
}

// ─── Categories ──────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const res = await fetchApi<ApiResponse<Category[]>>("/categories", {
    useCache: true,
    tags: ["categories"],
    revalidate: 3600,
  });
  return res.data;
}

export async function getNestedCategories(): Promise<Category[]> {
  const res = await fetchApi<ApiResponse<Category[]>>("/categories/nested", {
    useCache: true,
    tags: ["categories"],
    revalidate: 3600,
  });
  return res.data;
}

// ─── Products ────────────────────────────────────────────────

export interface ProductsParams {
  category?: string | string[];
  search?: string;
  sort?: "latest" | "price_asc" | "price_desc" | "oldest";
  page?: number;
  per_page?: number;
}

export async function getProducts(params?: ProductsParams): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();
  if (params?.category) {
    if (Array.isArray(params.category)) {
      params.category.forEach(cat => searchParams.append("category[]", cat));
    } else {
      searchParams.append("category[]", params.category);
    }
  }
  if (params?.search) searchParams.set("search", params.search);
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.per_page) searchParams.set("per_page", String(params.per_page));

  const qs = searchParams.toString();
  return fetchApi<PaginatedResponse<Product>>(`/products${qs ? `?${qs}` : ""}`, {
    useCache: true,
    tags: ["products"],
    revalidate: 600,
  });
}

export async function getProduct(slug: string): Promise<Product> {
  const res = await fetchApi<ApiResponse<Product>>(`/products/${encodeURIComponent(slug)}`, {
    useCache: true,
    tags: ["products", `product:${slug}`],
    revalidate: 600,
  });
  return res.data;
}

export async function getRelatedProducts(slug: string): Promise<Product[]> {
  const res = await fetchApi<ApiResponse<Product[]>>(`/products/${encodeURIComponent(slug)}/related`, {
    useCache: true,
    tags: ["products", `product:${slug}`],
    revalidate: 600,
  });
  return res.data;
}

// ─── Search ──────────────────────────────────────────────────

export async function searchProducts(query: string): Promise<Product[]> {
  const res = await getProducts({ search: query, per_page: 5 });
  return res.data;
}

// ─── Slides ──────────────────────────────────────────────────

export async function getSlides(): Promise<Slide[]> {
  const res = await fetchApi<ApiResponse<Slide[]>>("/slides", {
    useCache: true,
    tags: ["slides"],
    revalidate: 1800,
  });
  return res.data;
}

// ─── Home Sections ─────────────────────────────────────────────

export async function getHomeSections(): Promise<any[]> {
  const res = await fetchApi<ApiResponse<any[]>>("/home-sections", {
    useCache: true,
    tags: ["home-sections"],
    revalidate: 1800,
  });
  return res.data;
}

export async function getHomeSectionProducts(
  sectionId: string | number,
  page: number = 1
): Promise<PaginatedResponse<Product>> {
  return fetchApi<PaginatedResponse<Product>>(
    `/home-sections/${sectionId}/products?page=${page}`,
    {
      useCache: true,
      tags: ["products", `home-section:${sectionId}`],
      revalidate: 600,
    }
  );
}

// ─── Settings ────────────────────────────────────────────────

export async function getSettings(): Promise<Record<string, any>> {
  const res = await fetchApi<ApiResponse<Record<string, any>>>("/settings", {
    useCache: true,
    tags: ["settings"],
    revalidate: 3600,
  });
  return res.data;
}

// ─── Checkout ────────────────────────────────────────────────

export interface CheckoutPayload {
  name: string;
  phone: string;
  address: string;
  note?: string;
  shipping: "Inside Dhaka" | "Outside Dhaka";
  items: Array<{ id: string; quantity: number }>;
}

export interface CheckoutResponse {
  message: string;
  order: { id: number; total: number };
}

export async function placeOrder(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const result = await fetchApi<CheckoutResponse>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // New order ⇒ product data (stock, etc.) may have changed.
  revalidateTag("products");
  return result;
}

// ─── Reviews ──────────────────────────────────────────────────

export async function getProductReviews(slug: string, page: number = 1): Promise<any> {
  return fetchApi<any>(`/products/${slug}/reviews?page=${page}`, {
    useCache: page === 1,
    tags: page === 1 ? [`reviews:${slug}`] : undefined,
    revalidate: 300,
  });
}

export async function submitProductReview(slug: string, payload: any): Promise<any> {
  const result = await fetchApi<any>(`/products/${slug}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  revalidateTag(`reviews:${slug}`);
  revalidateTag(`product:${slug}`);
  return result;
}

// ─── Pages & Menus ───────────────────────────────────────────

export async function getPage(slug: string): Promise<Page> {
  const res = await fetchApi<ApiResponse<Page>>(`/pages/${encodeURIComponent(slug)}`, {
    useCache: true,
    tags: ["pages", `page:${slug}`],
    revalidate: 3600,
  });
  return res.data;
}

export async function getMenus(): Promise<Menu[]> {
  const res = await fetchApi<ApiResponse<Menu[]>>("/menus", {
    useCache: true,
    tags: ["menus"],
    revalidate: 3600,
  });
  return res.data;
}
