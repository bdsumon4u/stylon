import { getPage, getMediaUrl } from "@/lib/api";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Revalidate every hour (matches the API cache TTL on getPage)
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let page;
  try {
    page = await getPage(slug);
  } catch {
    return { title: "Page Not Found" };
  }

  const description = page.content
    ? page.content.replace(/<[^>]*>/g, "").slice(0, 160)
    : "";

  return {
    title: page.title,
    description,
  };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let page;
  try {
    page = await getPage(slug);
  } catch {
    notFound();
  }

  return (
    <div className="bg-white py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <h1 className="text-3xl lg:text-4xl font-bold text-black mb-8 border-b border-border-color pb-4">
          {page.title}
        </h1>
        <div
          className="prose prose-sm lg:prose-base max-w-none prose-headings:text-black prose-p:text-muted-text prose-li:text-muted-text"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}
