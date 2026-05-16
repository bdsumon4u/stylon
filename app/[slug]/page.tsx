"use client";

import { use, useState, useEffect } from "react";
import { getPage } from "@/lib/api";
import { Page } from "@/types";
import { Loader2 } from "lucide-react";

export default function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      try {
        const data = await getPage(slug);
        setPage(data);
      } catch (err) {
        console.error("Failed to fetch page:", err);
        setError("Page not found");
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-black">404 - Page Not Found</h1>
        <p className="text-muted-text">The page you are looking for does not exist.</p>
      </div>
    );
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
