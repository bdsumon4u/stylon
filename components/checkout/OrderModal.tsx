"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore, getCartLineId, getDisplayName } from "@/store/cart";
import { placeOrder, getSettings } from "@/lib/api";
import { saveThankYouOrder, buildThankYouOrder } from "@/lib/order-storage";
import { trackInitiateCheckout, trackPurchase } from "@/lib/analytics";
import { useCheckoutTracker } from "@/lib/checkout-tracking";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    <label className="block text-sm font-bold mb-1 text-black">
      {words.map((word, i) => (
        <span key={i} className={i === index ? "text-red-600 transition-colors duration-100" : ""}>
          {word}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </label>
  );
};

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [shippingOption, setShippingOption] = useState("inside");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shippingRates, setShippingRates] = useState({ inside: 80, outside: 150 });
  const { registerCheckoutInteractions } = useCheckoutTracker();

  // Track InitiateCheckout once per modal-open transition (not on every re-render
  // and not when the user re-opens after closing without submitting).
  const initiatedForRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      initiatedForRef.current = false;
      registerCheckoutInteractions();
      getSettings().then(settings => {
        if (settings?.delivery_charge) {
          setShippingRates({
            inside: parseInt(settings.delivery_charge.inside_dhaka) || 80,
            outside: parseInt(settings.delivery_charge.outside_dhaka) || 150,
          });
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  const shippingCost = shippingOption === "inside" ? shippingRates.inside : shippingRates.outside;

  if (!isOpen) return null;

  const totalPrice = getTotalPrice();
  const grandTotal = totalPrice + shippingCost;

  // Fire InitiateCheckout once per modal-open transition, only when there are
  // items to check out. Runs client-side only; analytics helper is SSR-safe.
  useEffect(() => {
    if (!isOpen || initiatedForRef.current) return;
    if (items.length === 0) return;
    initiatedForRef.current = true;
    trackInitiateCheckout(
      items,
      shippingCost,
      shippingOption === "inside" ? "Inside Dhaka" : "Outside Dhaka",
    );
  }, [isOpen, items, shippingCost, shippingOption]);

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

      // Snapshot order data for the /thank-you page.
      const orderItems = items.map(item => {
        const unitPrice = item.variation
          ? (item.variation.salePrice ?? item.variation.regularPrice)
          : (item.product.salePrice ?? item.product.regularPrice);
        const displayName = getDisplayName(item.product.name, item.variation?.name);
        return {
          id: item.variation?.id ?? item.product.id,
          name: displayName,
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
      onClose();
      router.push(`/thank-you?order=${res.order.id}`);
    } catch (err: any) {
      setError(err.message || "অর্ডার প্লেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  // If we just placed an order, we've already navigated away; bail out so we
  // don't render the form on top of the new page while React is still
  // flushing the previous render.
  if (submitting && items.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 overflow-y-auto">
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-[800px] my-auto overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Title Section */}
        <div className="bg-dark-gray text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">অর্ডার করতে আপনার নাম, মোবাইল নাম্বার, ঠিকানা দিয়ে অর্ডার কনফার্ম বাটনে ক্লিক করুন।</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Left Column - Form */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-sale-red text-sm p-3 rounded">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold mb-1 text-black">নাম <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="checkout-name"
                placeholder="এখানে নাম লিখুন..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-black">মোবাইল নাম্বার <span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="checkout-phone"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="মোবাইল নম্বর..."
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-black">ঠিকানা <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="checkout-address"
                placeholder="বাসা নং, রোড নং, থানা/উপজেলা, জেলা"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <AnimatedHeading />
              <textarea
                name="checkout-note"
                rows={3}
                placeholder="দয়া করে আপনার অর্ডারের জন্য যে কোন বিশেষ নির্দেশিকা বা পছন্দের সাইজ/কালার এখানে বলতে পারেন।"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none resize-none animate-pulse-border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-black">হোম ডেলিভারি চার্জ</label>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 border rounded p-2.5 cursor-pointer ${shippingOption === 'inside' ? 'border-primary shadow-sm bg-primary/5' : 'border-border-color'}`}>
                  <input 
                    type="radio" 
                    name="modal-shipping" 
                    checked={shippingOption === 'inside'} 
                    onChange={() => setShippingOption('inside')}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span className="text-sm font-medium">ঢাকা সিটির ভেতরে {shippingRates.inside} টাকা</span>
                </label>
                <label className={`flex items-center gap-3 border rounded p-2.5 cursor-pointer ${shippingOption === 'outside' ? 'border-primary shadow-sm bg-primary/5' : 'border-border-color'}`}>
                  <input 
                    type="radio" 
                    name="modal-shipping" 
                    checked={shippingOption === 'outside'} 
                    onChange={() => setShippingOption('outside')}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span className="text-sm font-medium">ঢাকা সিটির বাহিরে {shippingRates.outside} টাকা</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Cart Preview */}
          <div className="bg-gray-50 rounded border border-border-color p-4 flex flex-col h-full">
            <h3 className="font-bold text-black mb-4 pb-2 border-b border-border-color">অর্ডারের সারসংক্ষেপ</h3>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden mb-4 space-y-3 custom-scrollbar pr-1 max-h-[180px]">
              {items.map((item) => {
                const lineId = getCartLineId(item.product.id, item.variation?.id);
                const linePrice = item.variation
                  ? (item.variation.salePrice ?? item.variation.regularPrice)
                  : (item.product.salePrice ?? item.product.regularPrice);
                const lineImage = item.variation?.image || item.product.image;

                return (
                  <div key={lineId} className="flex gap-3 bg-white p-2 rounded border border-border-color relative">
                    <button
                      onClick={() => removeItem(lineId)}
                      className="absolute top-0 right-0 bg-sale-red text-white p-1 rounded-full z-10 hover:bg-red-600 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="w-14 h-16 bg-gray-100 rounded relative overflow-hidden shrink-0 border border-border-color">
                      <Image src={lineImage} alt={item.product.name || "Cart Item"} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <h4 className="text-[12px] font-medium text-black line-clamp-1 leading-tight">
                        {getDisplayName(item.product.name, item.variation?.name)}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center border border-border-color rounded bg-gray-50">
                          <button
                            className="px-1.5 py-0.5 text-black hover:bg-gray-200"
                            onClick={() => updateQuantity(lineId, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 py-0.5 text-[12px] text-black text-center min-w-[24px] font-medium bg-white border-x border-border-color">
                            {item.quantity}
                          </span>
                          <button
                            className="px-1.5 py-0.5 text-black hover:bg-gray-200"
                            onClick={() => updateQuantity(lineId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="font-bold text-[13px] text-primary">
                          {linePrice * item.quantity} Tk
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="text-center text-muted-text py-4 text-sm">Cart is empty</div>
              )}
            </div>

            {/* Payment Options */}
            <div className="pt-2 border-t border-[#f5ead7] mb-4">
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

            <div className="border-t border-border-color pt-3 space-y-2 mt-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-text">Product Price</span>
                <span className="font-medium text-black">{totalPrice} Tk</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-text">Delivery Charge</span>
                <span className="font-medium text-black">{shippingCost} Tk</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border-color">
                <span className="text-black">Total</span>
                <span className="text-sale-red">{grandTotal} Tk</span>
              </div>
              <button
                data-place-order
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded mt-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={items.length === 0 || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    অর্ডার করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <span>অর্ডার কনফার্ম করুন</span>
                    <span className="text-sm font-normal bg-white/20 px-2 py-0.5 rounded">Tk {grandTotal}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
