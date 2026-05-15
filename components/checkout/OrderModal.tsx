"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Minus, Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { placeOrder, getSettings } from "@/lib/api";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [shippingOption, setShippingOption] = useState("inside");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderId: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [shippingRates, setShippingRates] = useState({ inside: 80, outside: 150 });

  useEffect(() => {
    if (isOpen) {
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
        shipping: shippingOption === "inside" ? "Inside Dhaka" : "Outside Dhaka",
        items: items.map(item => ({
          id: item.product.id,
          quantity: item.quantity,
        })),
      });
      setSuccess({ orderId: res.order.id, total: res.order.total });
      clearCart();
    } catch (err: any) {
      setError(err.message || "অর্ডার প্লেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-[400px] p-8 text-center">
          <CheckCircle className="w-16 h-16 text-discount-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">অর্ডার সফল হয়েছে!</h2>
          <p className="text-muted-text mb-1">Order #{success.orderId}</p>
          <p className="text-lg font-bold text-primary mb-6">Total: {success.total} Tk</p>
          <p className="text-sm text-muted-text mb-6">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
          <button
            onClick={() => { setSuccess(null); onClose(); }}
            className="bg-black text-white font-bold py-3 px-8 rounded-md hover:bg-gray-800 transition-colors"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 overflow-y-auto">
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-[800px] my-auto overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Title Section */}
        <div className="bg-dark-gray text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">অর্ডার কনফার্ম করতে আপনার তথ্য দিন</h2>
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
                placeholder="আপনার নাম লিখুন" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-black">মোবাইল নাম্বার <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="01XXXXXXXXX" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-black">ঠিকানা <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="সম্পূর্ণ ঠিকানা লিখুন" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-bold mb-2 text-black">ডেলিভারি চার্জ</label>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 border rounded p-2.5 cursor-pointer ${shippingOption === 'inside' ? 'border-primary shadow-sm bg-primary/5' : 'border-border-color'}`}>
                  <input 
                    type="radio" 
                    name="modal-shipping" 
                    checked={shippingOption === 'inside'} 
                    onChange={() => setShippingOption('inside')}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span className="text-sm font-medium">Inside Dhaka ({shippingRates.inside} Tk)</span>
                </label>
                <label className={`flex items-center gap-3 border rounded p-2.5 cursor-pointer ${shippingOption === 'outside' ? 'border-primary shadow-sm bg-primary/5' : 'border-border-color'}`}>
                  <input 
                    type="radio" 
                    name="modal-shipping" 
                    checked={shippingOption === 'outside'} 
                    onChange={() => setShippingOption('outside')}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span className="text-sm font-medium">Outside Dhaka ({shippingRates.outside} Tk)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Cart Preview */}
          <div className="bg-gray-50 rounded border border-border-color p-4 flex flex-col h-full">
            <h3 className="font-bold text-black mb-4 pb-2 border-b border-border-color">অর্ডারের সারসংক্ষেপ</h3>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-1 max-h-[250px]">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 bg-white p-2 rounded border border-border-color relative">
                  <button 
                    onClick={() => removeItem(item.product.id)}
                    className="absolute -top-1.5 -right-1.5 bg-sale-red text-white p-1 rounded-full z-10 hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="w-14 h-16 bg-gray-100 rounded relative overflow-hidden shrink-0 border border-border-color">
                    <Image src={item.product.image} alt={item.product.name || "Cart Item"} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <h4 className="text-[12px] font-medium text-black line-clamp-1 leading-tight">{item.product.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center border border-border-color rounded bg-gray-50">
                        <button 
                          className="px-1.5 py-0.5 text-black hover:bg-gray-200"
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-0.5 text-[12px] text-black text-center min-w-[24px] font-medium bg-white border-x border-border-color">
                          {item.quantity}
                        </span>
                        <button 
                          className="px-1.5 py-0.5 text-black hover:bg-gray-200"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="font-bold text-[13px] text-primary">
                        {(item.product.salePrice || item.product.regularPrice) * item.quantity} Tk
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center text-muted-text py-4 text-sm">Cart is empty</div>
              )}
            </div>

            <div className="border-t border-border-color pt-3 space-y-2 mt-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-text">Subtotal</span>
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
