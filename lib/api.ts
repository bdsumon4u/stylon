import { Product, Category, Slide, PaginatedResponse, ApiResponse, Page, Menu } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/storefront";
export const MEDIA_BASE = API_BASE.replace('/api/storefront', '');

export function getMediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE}${path}`;
}

// ─── Client-side in-memory cache ────────────────────────────────────────────
// On the server, Next.js Data Cache (via the `next` fetch option) handles
// caching across requests. On the client this Map avoids redundant fetches
// within a single page session.
const clientCache = new Map<string, { data: any; timestamp: number }>();
const CLIENT_CACHE_TTL = 5 * 60 * 1000; // 5 min

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

interface FetchApiOptions extends RequestInit {
  /** If true, enable server-side Next.js Data Cache + client-side Map cache. */
  useCache?: boolean;
  /** Cache tags for on-demand revalidation (server only). */
  tags?: string[];
  /** ISR-style revalidation interval in seconds (server only). */
  revalidate?: number;
}

async function fetchApi<T>(endpoint: string, options?: FetchApiOptions): Promise<T> {
  const isCacheable = options?.useCache && (!options.method || options.method === "GET");
  const isClient = typeof window !== "undefined";

  // ── Client-side cache hit ─────────────────────────────────────────────────
  if (isClient && isCacheable) {
    const hit = clientCache.get(endpoint);
    if (hit && Date.now() - hit.timestamp < CLIENT_CACHE_TTL) {
      return hit.data;
    }
  }

  const url = `${API_BASE}${endpoint}`;

  // Set timeout: 5s on server (avoid holding up SSR), 8s on client.
  const timeoutMs = isClient ? 8000 : 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Build fetch init. The `next` property is a Next.js extension understood
  // server-side (activates the Data Cache). Browsers silently ignore unknown
  // keys in the options object, so this is safe to pass unconditionally.
  // We use `any` to avoid fighting with Next.js's internal `NextFetchRequestConfig` type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const init: any = {
    ...options,
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
  };

  if (isCacheable) {
    init.next = {
      revalidate: options?.revalidate ?? 3600,
      tags: options?.tags ?? ["storefront"],
    };
  }

  try {
    const res = await fetch(url, init);
    clearTimeout(timeoutId);

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API Error: ${res.status}`);
    }

    const data: T = await res.json();

    // ── Client-side cache write ───────────────────────────────────────────────
    if (isClient && isCacheable) {
      clientCache.set(endpoint, { data, timestamp: Date.now() });
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const res = await fetchApi<ApiResponse<Category[]>>("/categories", {
    useCache: true, tags: ["categories"], revalidate: 3600,
  });
  return res.data;
}

export async function getNestedCategories(): Promise<Category[]> {
  const res = await fetchApi<ApiResponse<Category[]>>("/categories/nested", {
    useCache: true, tags: ["categories"], revalidate: 3600,
  });
  return res.data;
}

// ─── Products ────────────────────────────────────────────────────────────────

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
    useCache: true, tags: ["products"], revalidate: 600,
  });
}

export async function getProduct(slug: string): Promise<Product> {
  const res = await fetchApi<ApiResponse<Product>>(`/products/${encodeURIComponent(slug)}`, {
    useCache: true, tags: ["products", `product:${slug}`], revalidate: 600,
  });
  return res.data;
}

/**
 * Synchronous cache peek — returns the product from the in-memory cache if
 * available, or null. Use this for instant-render: the page can call this
 * during render (before useEffect) to avoid the loading skeleton when the
 * data was already prefetched on hover.
 */
export function peekProduct(slug: string): Product | null {
  if (typeof window === "undefined") return null;
  const endpoint = `/products/${encodeURIComponent(slug)}`;
  const hit = clientCache.get(endpoint);
  if (!hit || Date.now() - hit.timestamp >= CLIENT_CACHE_TTL) return null;
  // Cache stores the ApiResponse<T> envelope, so we unwrap `data`.
  return (hit.data as ApiResponse<Product>)?.data ?? null;
}

export async function getRelatedProducts(slug: string): Promise<Product[]> {
  const res = await fetchApi<ApiResponse<Product[]>>(`/products/${encodeURIComponent(slug)}/related`, {
    useCache: true, tags: ["products", `product:${slug}`], revalidate: 600,
  });
  return res.data;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchProducts(query: string): Promise<Product[]> {
  const res = await getProducts({ search: query, per_page: 5 });
  return res.data;
}

// ─── Slides ──────────────────────────────────────────────────────────────────

export async function getSlides(): Promise<Slide[]> {
  const res = await fetchApi<ApiResponse<Slide[]>>("/slides", {
    useCache: true, tags: ["slides"], revalidate: 1800,
  });
  return res.data;
}

// ─── Home Sections ───────────────────────────────────────────────────────────

export async function getHomeSections(): Promise<any[]> {
  const res = await fetchApi<ApiResponse<any[]>>("/home-sections", {
    useCache: true, tags: ["home-sections"], revalidate: 1800,
  });
  return res.data;
}

export async function getHomeSectionProducts(
  sectionId: string | number,
  page: number = 1,
): Promise<PaginatedResponse<Product>> {
  return fetchApi<PaginatedResponse<Product>>(
    `/home-sections/${sectionId}/products?page=${page}`,
    { useCache: true, tags: ["products", `home-section:${sectionId}`], revalidate: 600 },
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Record<string, any>> {
  const res = await fetchApi<ApiResponse<Record<string, any>>>("/settings", {
    useCache: true, tags: ["settings"], revalidate: 3600,
  });
  return res.data;
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface CheckoutPayload {
  name: string;
  phone: string;
  address: string;
  note?: string;
  shipping: "Inside Dhaka" | "Outside Dhaka";
  items: Array<{ id: string; quantity: number; variation_id?: string | null }>;
}

export interface CheckoutResponse {
  message: string;
  order: { id: number; total: number };
}

export async function placeOrder(payload: CheckoutPayload): Promise<CheckoutResponse> {
  return fetchApi<CheckoutResponse>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function getProductReviews(slug: string, page: number = 1): Promise<any> {
  return fetchApi<any>(`/products/${slug}/reviews?page=${page}`, {
    useCache: page === 1,
    tags: page === 1 ? [`reviews:${slug}`] : undefined,
    revalidate: 300,
  });
}

export async function submitProductReview(slug: string, payload: any): Promise<any> {
  return fetchApi<any>(`/products/${slug}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Pages & Menus ───────────────────────────────────────────────────────────

export async function getPage(slug: string): Promise<Page> {
  const res = await fetchApi<ApiResponse<Page>>(`/pages/${encodeURIComponent(slug)}`, {
    useCache: true, tags: ["pages", `page:${slug}`], revalidate: 3600,
  });
  return res.data;
}

export async function getMenus(): Promise<Menu[]> {
  const res = await fetchApi<ApiResponse<Menu[]>>("/menus", {
    useCache: true, tags: ["menus"], revalidate: 3600,
  });
  return res.data;
}
