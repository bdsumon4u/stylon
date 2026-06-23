"use client";

import { useCartStore, getCartLineId, getDisplayName } from "@/store/cart";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { getSettings, placeOrder } from "@/lib/api";
import { useRouter } from "next/navigation";
import { saveThankYouOrder, buildThankYouOrder } from "@/lib/order-storage";
import { trackInitiateCheckout, trackPurchase } from "@/lib/analytics";
import { useCheckoutTracker } from "@/lib/checkout-tracking";

// Animated Heading Component for Note Area
const AnimatedHeading = () => {
  const text = "প্রয়োজনীয় কোনো তথ্য দিতে এই এখানে লিখুন:";
  const [index, setIndex] = useState(0);
  const words = text.split(" ");

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 350);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <h3 className="font-bold mb-2">
      {words.map((word, i) => (
        <span key={i} className={i === index ? "text-red-600 transition-colors duration-100" : ""}>
          {word}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h3>
  );
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [shippingOption, setShippingOption] = useState("inside");
  const [shippingRates, setShippingRates] = useState({ inside: 80, outside: 150 });
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { registerCheckoutInteractions } = useCheckoutTracker();

  useEffect(() => {
    setMounted(true);
    registerCheckoutInteractions();
    getSettings().then(settings => {
      if (settings?.delivery_charge) {
        setShippingRates({
          inside: parseInt(settings.delivery_charge.inside_dhaka) || 80,
          outside: parseInt(settings.delivery_charge.outside_dhaka) || 150,
        });
      }
    }).catch(console.error);
  }, []);

  const shippingCost = shippingOption === "inside" ? shippingRates.inside : shippingRates.outside;

  const totalPrice = getTotalPrice();
  const grandTotal = totalPrice + shippingCost;

  // Fire InitiateCheckout once per page mount when there are items.
  // Page mount = user landed on /checkout = checkout flow started.
  useEffect(() => {
    if (!mounted) return;
    if (items.length === 0) return;
    trackInitiateCheckout(
      items,
      shippingCost,
      shippingOption === "inside" ? "Inside Dhaka" : "Outside Dhaka",
    );
    // Intentionally only depend on mount — shippingOption can change inside
    // the form without re-firing the begin_checkout event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) { setError("নাম লিখুন"); return; }
    if (!phone.trim() || phone.length < 11) { setError("সঠিক মোবাইল নাম্বার দিন"); return; }
    if (!address.trim()) { setError("ঠিকানা লিখুন"); return; }
    if (items.length === 0) { setError("কার্ট খালি"); return; }

    setSubmitting(true);
    try {
      const res = await placeOrder({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        note: note.trim(),
        shipping: shippingOption === "inside" ? "Inside Dhaka" : "Outside Dhaka",
        items: items.map(item => ({
          id: item.product.id,
          quantity: item.quantity,
          variation_id: item.variation?.id ?? null,
        })),
      });

      // Build a snapshot of the order for the thank-you page and stash it in
      // sessionStorage. The page reads ?order=ID and falls back to the stored
      // blob for the full breakdown (items, address, etc.).
      const orderItems = items.map(item => {
        const unitPrice = item.variation
          ? (item.variation.salePrice ?? item.variation.regularPrice)
          : (item.product.salePrice ?? item.product.regularPrice);
        return {
          id: item.variation?.id ?? item.product.id,
          name: getDisplayName(item.product.name, item.variation?.name),
          image: item.variation?.image || item.product.image,
          quantity: item.quantity,
          price: unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      });

      // Fire Purchase event to FB Pixel + GTM dataLayer before clearing the
      // cart. Done immediately so the event isn't lost on route navigation.
      trackPurchase({
        orderId: res.order.id,
        total: res.order.total,
        shipping: shippingCost,
        shippingArea: shippingOption === "inside" ? "Inside Dhaka" : "Outside Dhaka",
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
        items: orderItems.map((oi) => ({
          id: oi.id,
          name: oi.name,
          quantity: oi.quantity,
          price: oi.price,
        })),
      });

      saveThankYouOrder(
        buildThankYouOrder({
          orderId: res.order.id,
          total: res.order.total,
          shipping: shippingCost,
          shippingArea: shippingOption === "inside" ? "Inside Dhaka" : "Outside Dhaka",
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            note: note.trim() || undefined,
          },
          items: orderItems,
          raw: res,
        })
      );

      clearCart();
      router.push(`/thank-you?order=${res.order.id}`);
    } catch (err: any) {
      setError(err.message || "অর্ডার প্লেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column - Cart Items */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded border border-border-color overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 bg-dark-gray text-white text-sm font-medium p-3">
              <div className="col-span-1">SL</div>
              <div className="col-span-2">Image</div>
              <div className="col-span-4 text-center">Name</div>
              <div className="col-span-2 text-center">Unit Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border-color">
              {items.map((item, idx) => {
                const lineId = getCartLineId(item.product.id, item.variation?.id);
                const linePrice = item.variation
                  ? (item.variation.salePrice ?? item.variation.regularPrice)
                  : (item.product.salePrice ?? item.product.regularPrice);
                const lineImage = item.variation?.image || item.product.image;

                return (
                  <div key={lineId} className="grid grid-cols-1 md:grid-cols-12 items-center p-4 gap-4 md:gap-0">
                    <div className="hidden md:block col-span-1 text-sm">{idx + 1}</div>
                    
                    <div className="col-span-1 md:col-span-2 flex justify-start">
                      <div className="w-16 h-20 bg-gray-100 rounded relative overflow-hidden border border-border-color">
                        <Image src={lineImage} alt={item.product.name} fill sizes="64px" className="object-cover" />
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-4 text-center md:text-left">
                      <h3 className="text-sm font-medium">{getDisplayName(item.product.name, item.variation?.name)}</h3>
                    </div>

                    <div className="col-span-1 md:col-span-2 text-center text-sm font-medium">
                      {linePrice} Tk
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-center">
                      <div className="flex items-center border border-border-color rounded">
                        <button 
                          className="p-1.5 text-black hover:bg-gray-50"
                          onClick={() => updateQuantity(lineId, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 text-sm text-center min-w-[32px] border-x border-border-color">
                          {item.quantity}
                        </span>
                        <button 
                          className="p-1.5 text-black hover:bg-gray-50"
                          onClick={() => updateQuantity(lineId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-1 flex justify-center mt-2 md:mt-0">
                      <button 
                        onClick={() => removeItem(lineId)}
                        className="bg-sale-red text-white p-2 rounded hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {items.length === 0 && (
                <div className="p-8 text-center text-muted-text">
                  আপনার কার্ট খালি।
                </div>
              )}
            </div>
            
            {/* Action Bar */}
            {items.length > 0 && false && (
              <div className="p-4 border-t border-border-color flex justify-center">
                <Link href="/shop" className="text-sale-red border border-sale-red px-6 py-2 rounded text-sm hover:bg-sale-red hover:text-white transition-colors">
                  Add more products to get free shipping
                </Link>
              </div>
            )}
          </div>

          <Link href="/shop" className="inline-flex text-primary text-sm items-center gap-1 hover:underline">
            ← Continue Shopping
          </Link>

          {/* Coupon & Totals (Desktop Left Side Bottom) */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mt-6">
            <div className="flex w-full md:w-auto">
              <template>
                <input
                  type="text"
                  placeholder="Apply Coupon..."
                  className="border border-border-color rounded-l px-4 py-2 outline-none focus:border-primary text-sm flex-1 md:w-[200px]"
                />
                <button className="bg-black text-white px-6 py-2 rounded-r text-sm font-medium">
                  Apply
                </button>
              </template>
            </div>

            <div className="w-full md:w-[300px] space-y-3 text-sm border-t md:border-none border-border-color pt-4 md:pt-0">
              <div className="flex justify-between">
                <span className="font-medium text-black">Product Price -</span>
                <span>{totalPrice} Tk</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-black">Delivery Charge -</span>
                <span>{shippingCost} Tk</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border-color pt-3 mt-3">
                <span className="text-black">Total -</span>
                <span>{grandTotal} Tk</span>
              </div>
            </div>
          </div>

          {/* Note Area */}
          <div className="mt-8 p-4 shadow-sm bg-[#fffdf7]">
            <AnimatedHeading />
            <textarea
              name="checkout-note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="দয়া করে আপনার অর্ডারের জন্য যে কোন বিশেষ নির্দেশিকা বা পছন্দের সাইজ/কালার এখানে বলতে পারেন।"
              className="w-full border border-border-color rounded p-3 text-sm focus:border-primary outline-none resize-none animate-pulse-border"
            ></textarea>
          </div>
        </div>

        {/* Right Column - Customer Info */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-[#fffdf7] border border-[#f5ead7] rounded-lg p-6 shadow-sm">
            <h3 className="text-[15px] font-bold text-center mb-6 leading-tight">
              অর্ডার কনফার্ম করতে আপনার নাম, মোবাইল নাম্বার, ঠিকানা লিখে অর্ডার করুন বাটনে ক্লিক করুন।
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-sale-red text-sm p-3 rounded mb-4 text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">নাম :</label>
                <input
                  type="text"
                  name="checkout-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="এখানে নাম লিখুন..."
                  className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">ঠিকানা :</label>
                <input
                  type="text"
                  name="checkout-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="বাসা নং, রোড নং, থানা/উপজেলা, জেলা"
                  className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">মোবাইল নাম্বার :</label>
                <input
                  type="tel"
                  name="checkout-phone"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="মোবাইল নম্বর..."
                  className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#f5ead7]">
                <h4 className="text-center font-bold text-primary mb-3">ডেলিভারি চার্জ</h4>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 border rounded p-3 cursor-pointer ${shippingOption === 'inside' ? 'border-primary shadow-sm bg-white' : 'border-border-color'}`}>
                    <input 
                      type="radio" 
                      name="shipping" 
                      checked={shippingOption === 'inside'} 
                      onChange={() => setShippingOption('inside')}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <span className="text-sm font-medium">ঢাকা সিটির ভেতরে - {shippingRates.inside} টাকা</span>
                  </label>
                  <label className={`flex items-center gap-3 border rounded p-3 cursor-pointer ${shippingOption === 'outside' ? 'border-primary shadow-sm bg-white' : 'border-border-color'}`}>
                    <input 
                      type="radio" 
                      name="shipping" 
                      checked={shippingOption === 'outside'} 
                      onChange={() => setShippingOption('outside')}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <span className="text-sm font-medium">ঢাকা সিটির বাহিরে - {shippingRates.outside} টাকা</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#f5ead7]">
                <h4 className="text-center font-bold text-primary mb-3">নিরাপদ পেমেন্ট অপশন</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 border border-primary bg-white rounded p-3 shadow-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked
                      readOnly
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <span className="text-sm font-medium text-primary">Cash on delivery</span>
                  </label>
                  <div className="bg-[#e5e7eb] p-3 rounded text-sm text-center border border-transparent">
                    Pay with upon delivery
                  </div>
                </div>
              </div>

              <button
                data-place-order
                onClick={handleSubmit}
                disabled={submitting || items.length === 0}
                className="w-full bg-[#00e5ff] text-white font-bold text-lg py-3 rounded mt-6 hover:bg-[#00d0eb] transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    অর্ডার করা হচ্ছে...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
