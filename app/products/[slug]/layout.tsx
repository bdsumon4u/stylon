import { mockProducts } from "@/data/mock";

export function generateStaticParams() {
  return mockProducts.map((product) => ({
    slug: product.slug,
  }));
}

export default function ProductDetailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
