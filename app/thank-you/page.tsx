"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Home,
  Package,
  Phone,
  Printer,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Check,
  User,
  MapPin,
  CreditCard,
  CalendarClock,
  Wallet,
  ArrowRight,
  Clock,
  PackageCheck,
  PackageOpen,
  ChevronDown,
  Tag,
} from "lucide-react";
import { clearThankYouOrder, getThankYouOrder, ThankYouOrder } from "@/lib/order-storage";
import { getSettings, getProducts } from "@/lib/api";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { MessengerIcon, FacebookIcon } from "@/components/icons/BrandIcons";

const formatTaka = (value: number) => `${value.toLocaleString("en-IN")} Tk`;

const TIMELINE_STAGES = [
  { key: "placed", label: "অর্ডার গৃহীত", icon: Check },
  { key: "processing", label: "প্রসেসিং", icon: PackageOpen },
  { key: "shipped", label: "শিপিং", icon: Truck },
  { key: "delivered", label: "ডেলিভারড", icon: PackageCheck },
] as const;

const PROMISES = [
  { icon: ShieldCheck, title: "নিরাপদ পেমেন্ট", desc: "ক্যাশ অন ডেলিভারি" },
  { icon: Truck, title: "দ্রুত ডেলিভারি", desc: "সারাদেশে ২-৪ দিন" },
  { icon: RotateCcw, title: "সহজ এক্সচেঞ্জ", desc: "প্রোডাক্টে সমস্যা থাকলে এক্সচেঞ্জ" },
  { icon: Headphones, title: "২৪/৭ সাপোর্ট", desc: "যেকোনো সময় কল করুন" },
] as const;

const FAQ = [
  {
    q: "অর্ডার কখন ডেলিভারি হবে?",
    a: "ঢাকার ভিতরে সাধারণত ১-২ কর্মদিবস এবং ঢাকার বাইরে ২-৪ কর্মদিবসের মধ্যে ডেলিভারি দেওয়া হয়।",
  },
  {
    q: "পণ্য রিটার্ন বা এক্সচেঞ্জ করতে চাইলে কী করব?",
    a: "পণ্য গ্রহণের ৭ দিনের মধ্যে আমাদের কাস্টমার কেয়ারে যোগাযোগ করুন। পণ্য অব্যবহৃত ও অক্ষত থাকতে হবে।",
  },
  {
    q: "পেমেন্ট কীভাবে করব?",
    a: "আপনি পণ্য হাতে পেয়ে ক্যাশ অন ডেলিভারির মাধ্যমে পেমেন্ট করতে পারবেন।",
  },
  {
    q: "অর্ডারের স্ট্যাটাস কীভাবে জানব?",
    a: "আমাদের ফোন কলের মাধ্যমে আপনাকে আপডেট দেওয়া হবে। আপনি চাইলে আমাদের হেল্পলাইনে কল করেও জানতে পারবেন।",
  },
] as const;

export default function ThankYouPage() {
  return (
    <Suspense fallback={<ThankYouSkeleton />}>
      <ThankYouContent />
    </Suspense>
  );
}

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("order");

  const [order, setOrder] = useState<ThankYouOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  useEffect(() => {
    const stored = getThankYouOrder();
    setOrder(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (order) {
      const t = setTimeout(() => clearThankYouOrder(), 1500);
      return () => clearTimeout(t);
    }
  }, [hydrated, order]);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings({}));
    getProducts({ per_page: 8, sort: "latest" })
      .then((res) => setRelatedProducts((res.data || []).slice(0, 4)))
      .catch(() => setRelatedProducts([]))
      .finally(() => setRelatedLoading(false));
  }, []);

  const displayOrderId = useMemo(() => {
    if (order?.orderId) return order.orderId;
    if (orderIdParam) return orderIdParam;
    return null;
  }, [order, orderIdParam]);

  const handleCopyOrderId = async () => {
    if (!displayOrderId) return;
    try {
      await navigator.clipboard.writeText(String(displayOrderId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  if (hydrated && !displayOrderId) {
    return (
      <EmptyState
        title="কোনো সাম্প্রতিক অর্ডার পাওয়া যায়নি"
        description="আপনি সরাসরি এই পেজে এসেছেন। অর্ডার করার পর এই পেজে অর্ডারের বিস্তারিত দেখতে পাবেন।"
      />
    );
  }

  if (!hydrated) {
    return <ThankYouSkeleton />;
  }

  if (!order) {
    return (
      <MinimalConfirmation
        orderId={String(displayOrderId)}
        onContinue={() => router.push("/shop")}
      />
    );
  }

  return (
    <div className="bg-light-bg pb-12 print:pb-0 print:bg-white">
      <HeroSection order={order} copied={copied} onCopyOrderId={handleCopyOrderId} />

      <div className="max-w-[1100px] mx-auto px-4 lg:px-8 -mt-6 md:-mt-10 relative z-10 space-y-6 no-print">
        <TimelineSection order={order} />
        <OrderReceipt order={order} copied={copied} onCopyOrderId={handleCopyOrderId} />
        <PromisesStrip />
        <ContactSection settings={settings} />
        <FAQSection />
        {relatedProducts.length > 0 && (
          <RelatedProductsSection products={relatedProducts} loading={relatedLoading} />
        )}
        <BottomCTAs />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   1. Hero
   ────────────────────────────────────────────────────────── */

function HeroSection({
  order,
  copied,
  onCopyOrderId,
}: {
  order: ThankYouOrder;
  copied: boolean;
  onCopyOrderId: () => void;
}) {
  const placedAt = useMemo(() => {
    try {
      return new Date(order.placedAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [order.placedAt]);

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 45%, #142420 100%), radial-gradient(ellipse at top right, rgba(22,163,74,0.22), transparent 60%)",
        backgroundBlendMode: "screen",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(22,163,74,0.30) 0%, rgba(22,163,74,0) 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 w-[320px] h-[320px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,75,92,0.18) 0%, rgba(255,75,92,0) 60%)",
        }}
      />

      <ConfettiAccents />

      <div className="relative max-w-[1100px] mx-auto px-4 lg:px-8 pt-12 md:pt-16 pb-20 text-center">
        <div className="relative inline-flex items-center justify-center mb-6">
          <span
            aria-hidden
            className="absolute inline-flex w-24 h-24 md:w-28 md:h-28 rounded-full bg-discount-green/20 animate-ping"
          />
          <span className="relative inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-discount-green to-[#0ea672] shadow-lg shadow-discount-green/40">
            <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 text-white" strokeWidth={2.5} />
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-white via-white to-discount-green bg-clip-text text-transparent">
            আলহামদুলিল্লাহ!
          </span>
        </h1>
        <p className="text-lg md:text-2xl font-bold mt-2 text-white">
          আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে 🌿
        </p>
        <p className="text-sm md:text-base text-gray-300 mt-2 max-w-xl mx-auto">
          ক্রয়মেলা পরিবারের সাথে থাকার জন্য জাযাকাল্লাহু খাইরান 🤲
        </p>
        <p className="text-sm md:text-base text-gray-300 mt-2 max-w-xl mx-auto">
          আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।
        </p>

        <div className="mt-7 inline-flex flex-col sm:flex-row items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 sm:px-2 sm:py-2">
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-gray-300">অর্ডার আইডি</span>
            <span className="text-base font-bold text-white tracking-wider">
              #{order.orderId}
            </span>
          </div>
          <button
            onClick={onCopyOrderId}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-discount-green" /> কপি হয়েছে
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> কপি করুন
              </>
            )}
          </button>
          {placedAt && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 px-2 border-l border-white/15">
              <CalendarClock className="w-3.5 h-3.5" /> {placedAt}
            </div>
          )}
        </div>

        <div className="mt-8 hidden lg:grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto">
          <HeroStat
            icon={<Package className="w-4 h-4" />}
            label="পণ্য"
            value={`${order.items.length} টি`}
          />
          <HeroStat
            icon={<CreditCard className="w-4 h-4" />}
            label="পেমেন্ট"
            value={order.paymentMethod}
          />
          <HeroStat
            icon={<MapPin className="w-4 h-4" />}
            label="ডেলিভারি"
            value={order.shippingArea}
          />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-3 text-left">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm md:text-base font-bold text-white line-clamp-1">
        {value}
      </div>
    </div>
  );
}

function ConfettiAccents() {
  const pieces = [
    { cls: "top-16 left-[8%] w-3 h-3 rounded-full bg-discount-green animate-float", delay: "0s" },
    { cls: "top-28 left-[20%] w-2 h-2 rounded-full bg-sale-red animate-float-slow", delay: "1.2s" },
    { cls: "top-12 right-[15%] w-2.5 h-2.5 rounded-full bg-yellow-400 animate-float", delay: "0.5s" },
    { cls: "top-40 right-[8%] w-3 h-3 rounded-full bg-discount-green/80 animate-float-slow", delay: "2s" },
    { cls: "bottom-16 left-[12%] w-2 h-2 rounded-full bg-yellow-300 animate-float", delay: "1.5s" },
    { cls: "bottom-24 right-[20%] w-2.5 h-2.5 rounded-full bg-sale-red/80 animate-float-slow", delay: "0.8s" },
  ];
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`absolute ${p.cls}`}
          style={{ animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   2. Timeline + quick facts
   ────────────────────────────────────────────────────────── */

function TimelineSection({ order }: { order: ThankYouOrder }) {
  const activeIndex = 0;
  return (
    <section className="hidden bg-white border border-border-color rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-black text-base md:text-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-discount-green" />
          অর্ডার স্ট্যাটাস
        </h2>
        <span className="text-[11px] uppercase tracking-wider text-discount-green font-bold bg-discount-green/10 px-2 py-1 rounded">
          নতুন
        </span>
      </div>

      <ol className="relative grid grid-cols-4 gap-1 sm:gap-2">
        <div
          aria-hidden
          className="absolute left-[12.5%] right-[12.5%] top-5 sm:top-6 h-0.5 bg-border-color -z-0"
        />
        <div
          aria-hidden
          className="absolute left-[12.5%] top-5 sm:top-6 h-0.5 bg-discount-green -z-0 transition-all"
          style={{ width: `${(activeIndex / (TIMELINE_STAGES.length - 1)) * 75}%` }}
        />

        {TIMELINE_STAGES.map((stage, idx) => {
          const isActive = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          const Icon = stage.icon;
          return (
            <li key={stage.key} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={
                  "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all " +
                  (isActive
                    ? "bg-gradient-to-br from-discount-green to-[#0ea672] text-white shadow-md shadow-discount-green/30"
                    : "bg-gray-100 text-muted-text")
                }
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {isCurrent && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full ring-2 ring-discount-green/40 animate-ping"
                  />
                )}
              </div>
              <span
                className={
                  "mt-2 text-[10px] sm:text-xs font-semibold leading-tight " +
                  (isActive ? "text-black" : "text-muted-text")
                }
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickFact
          icon={<Truck className="w-4 h-4" />}
          title="ডেলিভারি চার্জ"
          value={formatTaka(order.shipping)}
        />
        <QuickFact
          icon={<Clock className="w-4 h-4" />}
          title="আনুমানিক সময়"
          value="১-২ দিন"
        />
        <QuickFact
          icon={<Wallet className="w-4 h-4" />}
          title="পেমেন্ট"
          value={order.paymentMethod}
        />
      </div>
    </section>
  );
}

function QuickFact({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-light-bg border border-border-color rounded-xl p-3.5">
      <div className="w-9 h-9 rounded-full bg-discount-green/10 text-discount-green flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-text">{title}</div>
        <div className="text-sm font-bold text-black truncate">{value}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   3. Order receipt (ticket style)
   ────────────────────────────────────────────────────────── */

function OrderReceipt({
  order,
  copied,
  onCopyOrderId,
}: {
  order: ThankYouOrder;
  copied: boolean;
  onCopyOrderId: () => void;
}) {
  return (
    <section className="print-receipt bg-white border border-border-color rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 relative">
        <div
          aria-hidden
          className="hidden md:block absolute top-1/2 -translate-y-1/2 left-1/3 -translate-x-1/2 w-6 h-6 rounded-full bg-light-bg border border-border-color"
        />
        <div
          aria-hidden
          className="hidden md:block absolute top-1/2 -translate-y-1/2 right-1/3 translate-x-1/2 w-6 h-6 rounded-full bg-light-bg border border-border-color"
        />

        <div className="md:col-span-2 p-5 md:p-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-text">
            <Tag className="w-3.5 h-3.5" /> অর্ডার রিসিট
          </div>
          <h2 className="font-extrabold text-black text-xl md:text-2xl mt-1">
            #{order.orderId}
          </h2>
          <p className="text-sm text-muted-text mt-1">
            মোট {order.items.length} টি পণ্য · {order.shippingArea}
          </p>
        </div>

        <div className="md:col-span-1 bg-gradient-to-br from-discount-green to-[#0ea672] text-white p-5 md:p-7 flex md:flex-col items-center md:items-start justify-between md:justify-center gap-2">
          <span className="text-xs uppercase tracking-wider text-white/80">সর্বমোট</span>
          <span className="text-2xl md:text-3xl font-extrabold tracking-tight">
            ৳{order.total}
          </span>
        </div>
      </div>

      <div aria-hidden className="border-t border-dashed border-border-color mx-5 md:mx-7" />

      <div className="grid grid-cols-2 gap-x-8 gap-y-5 px-5 md:px-7 py-5 md:py-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text mb-3">
            কাস্টমার তথ্য
          </h3>
          <dl className="space-y-2.5 text-sm">
            <ReceiptInfo icon={<User className="w-4 h-4" />} label="নাম" value={order.customer.name} />
            <ReceiptInfo icon={<Phone className="w-4 h-4" />} label="ফোন" value={order.customer.phone} />
            <ReceiptInfo icon={<MapPin className="w-4 h-4" />} label="ঠিকানা" value={order.customer.address} />
            {order.customer.note && (
              <ReceiptInfo
                icon={<Sparkles className="w-4 h-4" />}
                label="নোট"
                value={order.customer.note}
                italic
              />
            )}
          </dl>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text mb-3">
            অর্ডার তথ্য
          </h3>
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <dt className="w-7 h-7 rounded-md bg-discount-green/10 text-discount-green flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </dt>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-text">পেমেন্ট</div>
                <div className="font-semibold text-black">{order.paymentMethod}</div>
              </div>
            </div>
            <ReceiptInfo icon={<Truck className="w-4 h-4" />} label="ডেলিভারি" value={order.shippingArea} />
            <ReceiptInfo icon={<Wallet className="w-4 h-4" />} label="ডেলিভারি চার্জ" value={formatTaka(order.shipping)} />
          </dl>
        </div>
      </div>

      <div className="px-5 md:px-7 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text mb-3">
          পণ্য ({order.items.length})
        </h3>
        <ul className="border border-border-color rounded-xl overflow-hidden divide-y divide-border-color">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 p-3 md:p-4 hover:bg-light-bg/60 transition-colors border-l-2 border-l-transparent hover:border-l-discount-green"
            >
              <div className="relative w-14 h-16 md:w-16 md:h-20 rounded-md bg-gray-100 overflow-hidden border border-border-color shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-black line-clamp-2">
                  {item.name}
                </h4>
                <p className="text-xs text-muted-text mt-0.5">
                  ৳{item.price} × {item.quantity}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-black">৳{item.subtotal}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 md:px-7 py-5 md:py-6">
        <dl className="ml-auto max-w-sm space-y-2 text-sm">
          <TotalRow label="সাবটোটাল" value={formatTaka(order.subtotal)} />
          <TotalRow label="ডেলিভারি চার্জ" value={formatTaka(order.shipping)} />
          <TotalRow label="ডিসকাউন্ট" value="৳0" />
          <div className="border-t border-dashed border-border-color pt-3 mt-3 flex items-baseline justify-between">
            <dt className="font-bold text-black text-base">সর্বমোট</dt>
            <dd className="font-extrabold text-discount-green text-2xl">
              {formatTaka(order.total)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="px-5 md:px-7 pb-5 md:pb-7 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
        <button
          onClick={onCopyOrderId}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-discount-green to-[#0ea672] hover:from-[#0ea672] hover:to-discount-green text-white font-semibold py-3 rounded-xl transition-all shadow-sm shadow-discount-green/20"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> কপি হয়েছে
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> অর্ডার আইডি কপি করুন
            </>
          )}
        </button>
        <button
          onClick={() => typeof window !== "undefined" && window.print()}
          className="hidden md:inline-flex items-center justify-center gap-2 bg-dark-gray hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <Printer className="w-4 h-4" /> প্রিন্ট / সেভ করুন
        </button>
      </div>
    </section>
  );
}

function ReceiptInfo({
  icon,
  label,
  value,
  italic,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <dt className="w-7 h-7 rounded-md bg-light-bg text-muted-text flex items-center justify-center shrink-0">
        {icon}
      </dt>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-text">{label}</div>
        <dd className={"font-medium text-black break-words " + (italic ? "italic" : "")}>
          {value}
        </dd>
      </div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-text">{label}</dt>
      <dd className="font-semibold text-black">{value}</dd>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   4. Why-choose-us strip
   ────────────────────────────────────────────────────────── */

function PromisesStrip() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-gray via-[#262626] to-dark-gray text-white p-5 md:p-7 border border-white/5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(22,163,74,0.20) 0%, rgba(22,163,74,0) 60%)",
        }}
      />
      <div className="relative">
        <h2 className="text-center text-xl md:text-2xl font-extrabold">
          কেন আমাদের সাথে শপিং করবেন?
        </h2>
        <p className="text-center text-sm text-gray-300 mt-1 mb-5">
          আমরা আপনার সন্তুষ্টিকে সর্বোচ্চ গুরুত্ব দিই
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROMISES.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="flex flex-col items-center text-center bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:-translate-y-0.5 transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-discount-green/20 text-discount-green flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">{p.title}</h3>
                <p className="text-xs text-gray-300 mt-1 leading-snug">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   5. Contact tiles
   ────────────────────────────────────────────────────────── */

function ContactSection({ settings }: { settings: any }) {
  const phone = settings?.company?.phone || "";
  const whatsapp = settings?.company?.whatsapp || "";
  const facebook = settings?.social?.facebook?.link || "#";
  const messenger = settings?.company?.messenger || "#";
  const callHref = phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : "#";
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`
    : "#";

  return (
    <section className="bg-white border border-border-color rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5 md:p-7">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-extrabold text-black">
          যোগাযোগ করুন
        </h2>
        <p className="text-sm text-muted-text mt-1">
          যেকোনো প্রয়োজনে আমরা সবসময় আছি আপনার পাশে
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <ContactTile
          href={facebook}
          label="Facebook"
          sub="@facebook"
          bgClass="bg-[#1877F2]"
          icon={<FacebookIcon className="w-6 h-6" />}
        />
        <ContactTile
          href={messenger}
          label="Messenger"
          sub="দ্রুত মেসেজ"
          bgClass="bg-[#0084FF]"
          icon={<MessengerIcon className="w-6 h-6" />}
        />
        <ContactTile
          href={callHref}
          label={phone || "কল করুন"}
          sub="সরাসরি কথা বলুন"
          bgClass="bg-[#16a34a]"
          icon={<Phone className="w-6 h-6" />}
        />
        <ContactTile
          href={waHref}
          label="WhatsApp"
          sub="দ্রুত রিপ্লাই"
          bgClass="bg-[#25D366]"
          icon={<WhatsAppIcon className="w-6 h-6" />}
        />
      </div>
    </section>
  );
}

function ContactTile({
  href,
  label,
  sub,
  bgClass,
  icon,
}: {
  href: string;
  label: string;
  sub: string;
  bgClass: string;
  icon: React.ReactNode;
}) {
  const isPlaceholder = href === "#";
  const inner = (
    <div
      className={
        "flex flex-col items-center text-center gap-2 p-4 md:p-5 bg-white border border-border-color rounded-2xl transition-all " +
        (isPlaceholder
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-lg hover:-translate-y-1 hover:border-discount-green/30 cursor-pointer")
      }
    >
      <div
        className={
          "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-md " +
          bgClass
        }
      >
        {icon}
      </div>
      <div className="text-sm font-bold text-black line-clamp-1">{label}</div>
      <div className="text-[11px] text-muted-text">{sub}</div>
    </div>
  );

  if (isPlaceholder) {
    return <div aria-disabled>{inner}</div>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  );
}

/* ──────────────────────────────────────────────────────────
   6. FAQ accordion
   ────────────────────────────────────────────────────────── */

function FAQSection() {
  return (
    <section className="hidden bg-white border border-border-color rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5 md:p-7">
      <div className="text-center mb-5">
        <h2 className="text-xl md:text-2xl font-extrabold text-black">
          সচরাচর জিজ্ঞাসা
        </h2>
        <p className="text-sm text-muted-text mt-1">
          অর্ডার সংক্রান্ত প্রায়শই জিজ্ঞাসিত প্রশ্ন
        </p>
      </div>
      <div className="max-w-2xl mx-auto space-y-2">
        {FAQ.map((item, i) => (
          <details
            key={i}
            open={i === 0}
            className="group bg-light-bg border border-border-color rounded-xl overflow-hidden [&[open]]:bg-white [&[open]]:border-discount-green/30 transition-colors"
          >
            <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none select-none">
              <span className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-discount-green/10 text-discount-green flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="font-semibold text-black text-sm md:text-base">
                  {item.q}
                </span>
              </span>
              <ChevronDown className="w-4 h-4 text-muted-text group-open:rotate-180 group-open:text-discount-green transition-transform shrink-0" />
            </summary>
            <div className="px-4 pb-4 pt-1 text-sm text-muted-text leading-relaxed border-t border-border-color/60">
              <div className="pt-3">{item.a}</div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   7. Related products
   ────────────────────────────────────────────────────────── */

function RelatedProductsSection({
  products,
  loading,
}: {
  products: Product[];
  loading: boolean;
}) {
  return (
    <section className="bg-white border border-border-color rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5 md:p-7">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-extrabold text-black text-lg md:text-xl">
            আপনার জন্য আরও কিছু
          </h2>
          <p className="text-xs text-muted-text mt-0.5">
            আপনার পছন্দ হতে পারে এমন কিছু পণ্য
          </p>
        </div>
        <Link
          href="/shop"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-discount-green hover:underline"
        >
          সব দেখুন <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      )}

      <div className="sm:hidden mt-4 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm font-semibold text-discount-green"
        >
          সব পণ্য দেখুন <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   8. Bottom CTAs
   ────────────────────────────────────────────────────────── */

function BottomCTAs() {
  return (
    <section className="bg-gradient-to-r from-light-bg to-white border border-border-color rounded-2xl p-6 md:p-8 text-center">
      <h3 className="font-bold text-black text-lg md:text-xl">
        আরও কেনাকাটা করতে চান?
      </h3>
      <p className="text-sm text-muted-text mt-1">
        আমাদের কালেকশন থেকে আপনার পছন্দের পণ্য বেছে নিন
      </p>
      <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-white border border-border-color text-black font-semibold px-6 py-3 rounded-xl hover:bg-light-bg transition-colors"
        >
          <Home className="w-4 h-4" /> হোম পেজে ফিরে যান
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-dark-gray text-white font-semibold px-6 py-3 rounded-xl hover:from-dark-gray hover:to-primary transition-all shadow-md"
        >
          আরও শপিং করুন <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   Edge-case states
   ────────────────────────────────────────────────────────── */

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-5">
        <Package className="w-8 h-8 text-muted-text" />
      </div>
      <h1 className="text-2xl font-bold text-black mb-2">{title}</h1>
      <p className="text-muted-text mb-6">{description}</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        <Home className="w-4 h-4" /> হোম পেজে ফিরে যান
      </Link>
    </div>
  );
}

function MinimalConfirmation({
  orderId,
  onContinue,
}: {
  orderId: string;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-[600px] mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-border-color shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-discount-green text-white mb-4">
          <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">অর্ডার সফল হয়েছে!</h1>
        <p className="text-muted-text mb-1">Order ID</p>
        <p className="text-2xl font-extrabold text-primary mb-4">#{orderId}</p>
        <p className="text-sm text-muted-text mb-6">
          আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো। অর্ডারের বিস্তারিত দেখতে ইমেইল চেক করুন।
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white border border-border-color text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50"
          >
            <Home className="w-4 h-4" /> হোম
          </Link>
          <button
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-xl"
          >
            আরও শপিং করুন <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ThankYouSkeleton() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-10 animate-pulse space-y-6">
      <div className="h-72 w-full bg-dark-gray/20 rounded-2xl" />
      <div className="h-40 w-full bg-white rounded-2xl" />
      <div className="h-80 w-full bg-white rounded-2xl" />
      <div className="h-40 w-full bg-white rounded-2xl" />
    </div>
  );
}
