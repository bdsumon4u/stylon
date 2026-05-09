"use client";

import { useCartStore } from "@/store/cart";
import { useState } from "react";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";

export default function CheckoutPage() {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const [shippingOption, setShippingOption] = useState("inside");
  const shippingCost = shippingOption === "inside" ? 80 : 150;
  
  const totalPrice = getTotalPrice();
  const grandTotal = totalPrice + shippingCost;

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
              {items.map((item, idx) => (
                <div key={item.product.id} className="grid grid-cols-1 md:grid-cols-12 items-center p-4 gap-4 md:gap-0">
                  <div className="hidden md:block col-span-1 text-sm">{idx + 1}</div>
                  
                  <div className="col-span-1 md:col-span-2 flex justify-start">
                    <div className="w-16 h-20 bg-gray-100 rounded relative overflow-hidden border border-border-color">
                      <Image src={item.product.image} alt={item.product.name} fill sizes="64px" className="object-cover" />
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-4 text-center md:text-left">
                    <h3 className="text-sm font-medium">{item.product.name}</h3>
                  </div>

                  <div className="col-span-1 md:col-span-2 text-center text-sm font-medium">
                    {item.product.salePrice || item.product.regularPrice} Tk
                  </div>

                  <div className="col-span-1 md:col-span-2 flex justify-center">
                    <div className="flex items-center border border-border-color rounded">
                      <button 
                        className="p-1.5 text-black hover:bg-gray-50"
                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-1 text-sm text-center min-w-[32px] border-x border-border-color">
                        {item.quantity}
                      </span>
                      <button 
                        className="p-1.5 text-black hover:bg-gray-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-1 flex justify-center mt-2 md:mt-0">
                    <button 
                      onClick={() => removeItem(item.product.id)}
                      className="bg-sale-red text-white p-2 rounded hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Bar */}
            <div className="p-4 border-t border-border-color flex justify-center">
              <button className="text-sale-red border border-sale-red px-6 py-2 rounded text-sm hover:bg-sale-red hover:text-white transition-colors">
                Add more products to get free shipping
              </button>
            </div>
          </div>

          <button className="text-primary text-sm flex items-center gap-1 hover:underline">
            ← Continue Shopping
          </button>

          {/* Coupon & Totals (Desktop Left Side Bottom) */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mt-6">
            <div className="flex w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Apply Coupon..." 
                className="border border-border-color rounded-l px-4 py-2 outline-none focus:border-primary text-sm flex-1 md:w-[200px]"
              />
              <button className="bg-black text-white px-6 py-2 rounded-r text-sm font-medium">
                Apply
              </button>
            </div>

            <div className="w-full md:w-[300px] space-y-3 text-sm border-t md:border-none border-border-color pt-4 md:pt-0">
              <div className="flex justify-between">
                <span className="font-medium text-black">Regular Price -</span>
                <span>{totalPrice} Tk</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-black">Discount -</span>
                <span>0 Tk</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-black">Offer Price -</span>
                <span>{totalPrice} Tk</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-black">Delivery Charge -</span>
                <span>{shippingCost} Tk</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-black">Coupon Discount -</span>
                <span>0 Tk</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border-color pt-3 mt-3">
                <span className="text-black">Total -</span>
                <span>{grandTotal} Tk</span>
              </div>
            </div>
          </div>

          {/* Note Area */}
          <div className="mt-8">
            <h3 className="font-bold mb-2">প্রয়োজনীয় কোনো তথ্য দিতে এই এখানে লিখুন:</h3>
            <textarea 
              rows={4}
              placeholder="দয়া করে আপনার অর্ডারের জন্য যে কোনও বিশেষ নির্দেশিকা বা পছন্দ দিন এখানে বলতে পারেন।"
              className="w-full border border-border-color rounded p-3 text-sm focus:border-primary outline-none resize-none"
            ></textarea>
          </div>
        </div>

        {/* Right Column - Customer Info */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-[#fffdf7] border border-[#f5ead7] rounded-lg p-6 shadow-sm">
            <h3 className="text-[15px] font-bold text-center mb-6 leading-tight">
              অর্ডার কনফার্ম করতে আপনার নাম, মোবাইল নাম্বার, ঠিকানা লিখে অর্ডার করুন বাটনে ক্লিক করুন।
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">নাম :</label>
                <input 
                  type="text" 
                  placeholder="এখানে নাম লিখুন..." 
                  className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">ঠিকানা :</label>
                <input 
                  type="text" 
                  placeholder="বাসা নং, রোড নং, থানা/উপজেলা, জেলা" 
                  className="w-full border border-border-color rounded px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">মোবাইল নাম্বার :</label>
                <input 
                  type="text" 
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
                    <span className="text-sm font-medium">Inside Dhaka</span>
                  </label>
                  <label className={`flex items-center gap-3 border rounded p-3 cursor-pointer ${shippingOption === 'outside' ? 'border-primary shadow-sm bg-white' : 'border-border-color'}`}>
                    <input 
                      type="radio" 
                      name="shipping" 
                      checked={shippingOption === 'outside'} 
                      onChange={() => setShippingOption('outside')}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <span className="text-sm font-medium">Outside Dhaka</span>
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

              <button className="w-full bg-[#00e5ff] text-white font-bold text-lg py-3 rounded mt-6 hover:bg-[#00d0eb] transition-colors shadow-md">
                Place Order
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
