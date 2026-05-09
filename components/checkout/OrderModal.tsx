"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const [shippingOption, setShippingOption] = useState("inside");
  const shippingCost = shippingOption === "inside" ? 80 : 150;
  
  if (!isOpen) return null;

  const totalPrice = getTotalPrice();
  const grandTotal = totalPrice + shippingCost;

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
            <div>
              <label className="block text-sm font-bold mb-1 text-black">নাম <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="আপনার নাম লিখুন" 
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-black">মোবাইল নাম্বার <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="আপনার মোবাইল নাম্বার লিখুন" 
                className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-black">ঠিকানা <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="সম্পূর্ণ ঠিকানা লিখুন" 
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
                  <span className="text-sm font-medium">Inside Dhaka (80 Tk)</span>
                </label>
                <label className={`flex items-center gap-3 border rounded p-2.5 cursor-pointer ${shippingOption === 'outside' ? 'border-primary shadow-sm bg-primary/5' : 'border-border-color'}`}>
                  <input 
                    type="radio" 
                    name="modal-shipping" 
                    checked={shippingOption === 'outside'} 
                    onChange={() => setShippingOption('outside')}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span className="text-sm font-medium">Outside Dhaka (150 Tk)</span>
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
                    <Image src={item.product.image} alt={item.product.name} fill sizes="56px" className="object-cover" />
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
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded mt-2 transition-colors flex items-center justify-center gap-2"
                disabled={items.length === 0}
              >
                <span>অর্ডার কনফার্ম করুন</span>
                <span className="text-sm font-normal bg-white/20 px-2 py-0.5 rounded">Tk {grandTotal}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
