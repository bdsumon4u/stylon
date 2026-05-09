"use client";

import { ArrowUp, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

export function FloatingWidgets() {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScroll]);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 pointer-events-none z-30 px-4 max-w-[1440px] mx-auto w-full flex justify-between items-end">
      {/* Scroll to top */}
      <div 
        className={`pointer-events-auto transition-opacity duration-300 ${showScroll ? "opacity-100" : "opacity-0"}`}
      >
        <button
          onClick={scrollTop}
          className="w-10 h-10 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>

      {/* Live Chat */}
      <div className="pointer-events-auto flex flex-col items-center">
        <button className="w-12 h-12 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center shadow-lg transition-colors mb-1">
          <MessageSquare className="w-6 h-6" />
        </button>
        <span className="text-[10px] font-bold text-black drop-shadow-sm bg-white/80 px-1 rounded">Live Chat</span>
      </div>
    </div>
  );
}
