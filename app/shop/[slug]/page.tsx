import { getProduct, getProducts, getMediaUrl } from "@/lib/api";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailsClient from "@/components/product/ProductDetailsClient";

// Revalidate every 10 minutes (matches the product API cache TTL)
export const revalidate = 600;

// Pre-generate the first 100 products at build time.
// Products beyond this are generated on-demand and then cached.
export async function generateStaticParams() {
  try {
    const res = await getProducts({ per_page: 100 });
    return res.data.map((product) => ({
      slug: product.slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch {
    return { title: "Product Not Found" };
  }

  const description = product.shortDescription
    || (product.description
      ? product.description.replace(/<[^>]*>/g, "").slice(0, 160)
      : "");

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [getMediaUrl(product.image)] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  return <ProductDetailsClient initialProduct={product} slug={slug} />;
}
