"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Currency from "@/components/global/CurrencySymbol";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext"; // ← import your cart context
import { db } from "@/firebase/config";
import { setDoc, doc } from "firebase/firestore";

const API_BASE = process.env.NEXT_PUBLIC_EXPRESS_URL || "http://localhost:5001";

export default function CheckoutForm({ supplierId, items, total }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { clearCart } = useCart(); // ← get clearCart

  // form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    suite: "",
    city: "",
    state: "",
    zip: "",
    isGift: false,
  });
  const [paymentMethod, setPaymentMethod] = useState("hyperpay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // cost calculations
  const shippingCost = items.reduce((sum, i) => sum + (i.shippingCost || 0), 0);
  const vat = (total + shippingCost) * 0.15;
  const grandTotal = total + shippingCost + vat;

  // guard: must be logged in + have items
  useEffect(() => {
    if (!currentUser) {
      toast.error("Please log in");
      router.push("/user-login");
    } else if (items.length === 0) {
      router.push("/cart");
    }
  }, [currentUser, items.length, router]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function createInvoice(path, payload) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  }

  async function onPay() {
    setLoading(true);
    setError(null);

    try {
      const base = {
        supplierId,
        shippingCost,
        vat,
        amount: grandTotal,
        items,
        ...form,
      };

      if (paymentMethod === "sadad") {
        // 1) create the invoice on your Express + GoPay
        const invoice = await createInvoice("/api/create-invoice", {
          ...base,
          billNumber: Date.now().toString(),
        });

        // 2) save into Orders collection
        await setDoc(doc(db, "orders", invoice.billNumber), {
          orderId: invoice.billNumber,
          method: "sadad",
          items,
          shippingCost,
          vat,
          total: grandTotal,
          customer: {
            uid: currentUser.uid,
            name: `${form.firstName} ${form.lastName}`.trim(),
            phone: form.phone,
            address: {
              address: form.address,
              suite: form.suite,
              city: form.city,
              state: form.state,
              zip: form.zip,
            },
          },
          sadadNumber: invoice.billNumber,
          createdAt: new Date().toISOString(),
          status: "pending",
        });

        // 3) **clear the cart**
        await clearCart();

        // 4) navigate to your internal success page
        return router.push(`/payment-details?orderId=${invoice.billNumber}`);
      }

      // …handle other payment methods similarly…

      throw new Error("Please select a payment method");
    } catch (e) {
      console.error(e);
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='grid md:grid-cols-2 gap-8'>
      {/* ─── LEFT COLUMN: Shipping & Method ───────────────────────── */}
      <div className='space-y-6'>
        <fieldset className='space-y-4 border p-4 rounded'>
          <legend className='font-medium'>Shipping address</legend>

          {/* First / Last */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm'>First name*</label>
              <Input
                name='firstName'
                required
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className='block text-sm'>Last name*</label>
              <Input
                name='lastName'
                required
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className='block text-sm'>Phone*</label>
            <Input
              name='phone'
              type='tel'
              required
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div>
            <label className='block text-sm'>Address*</label>
            <Input
              name='address'
              required
              value={form.address}
              onChange={handleChange}
            />
          </div>

          {/* Suite */}
          <div>
            <label className='block text-sm'>Apt, suite, etc. (optional)</label>
            <Input name='suite' value={form.suite} onChange={handleChange} />
          </div>

          {/* City / State / ZIP */}
          <div className='grid grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm'>City*</label>
              <Input
                name='city'
                required
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className='block text-sm'>State*</label>
              <select
                name='state'
                required
                value={form.state}
                onChange={handleChange}
                className='border rounded px-2 py-1 w-full'
              >
                <option value=''>Select</option>
                <option>CA</option>
                <option>NY</option>
              </select>
            </div>
            <div>
              <label className='block text-sm'>ZIP*</label>
              <Input
                name='zip'
                required
                value={form.zip}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Gift */}
          <div className='flex items-center gap-2'>
            <input
              id='gift'
              name='isGift'
              type='checkbox'
              checked={form.isGift}
              onChange={handleChange}
            />
            <label htmlFor='gift' className='text-sm'>
              This order is a gift
            </label>
          </div>
        </fieldset>

        {/* PAYMENT METHOD */}
        <div className='space-y-4'>
          {/* HyperPay */}
          <label
            className={`flex items-center border rounded p-4 cursor-pointer ${
              paymentMethod === "hyperpay"
                ? "border-blue-600"
                : "border-gray-300"
            }`}
          >
            <input
              type='radio'
              name='payment'
              value='hyperpay'
              checked={paymentMethod === "hyperpay"}
              onChange={() => setPaymentMethod("hyperpay")}
              className='mr-4'
            />
            <div className='flex-1'>
              <div className='font-medium'>Debit/Credit Card</div>
              <div className='text-xs text-gray-500'>
                Fast, secure card processing
              </div>
            </div>
          </label>

          {/* GoPay / SADAD */}
          <label
            className={`flex items-center border rounded p-4 cursor-pointer ${
              paymentMethod === "sadad" ? "border-blue-600" : "border-gray-300"
            }`}
          >
            <input
              type='radio'
              name='payment'
              value='sadad'
              checked={paymentMethod === "sadad"}
              onChange={() => setPaymentMethod("sadad")}
              className='mr-4'
            />
            <div className='flex-1'>
              <div className='font-medium'>SADAD</div>
            </div>
            <img src='/sadad.png' alt='SADAD' className='h-6' />
          </label>

          {/* GoPay Wallet */}
          <label
            className={`flex items-center border rounded p-4 cursor-pointer ${
              paymentMethod === "gpay" ? "border-blue-600" : "border-gray-300"
            }`}
          >
            <input
              type='radio'
              name='payment'
              value='gpay'
              checked={paymentMethod === "gpay"}
              onChange={() => setPaymentMethod("gpay")}
              className='mr-4'
            />
            <div className='flex-1'>
              <div className='font-medium'>GoPay Wallet</div>
            </div>
            <img src='/gopay-logo.png' alt='GoPay' className='h-6' />
          </label>

          {error && <p className='text-red-600'>{error}</p>}
        </div>
      </div>

      {/* RIGHT COLUMN: Order Summary & Continue Button */}
      <div className='border p-6 rounded bg-gray-50 space-y-4'>
        <h2 className='text-xl font-semibold text-center'>Order summary</h2>

        {items.map((i) => (
          <div key={i.id} className='flex justify-between text-sm'>
            <span>
              {i.productName} × {i.quantity}
            </span>
            <Currency amount={i.subtotal} />
          </div>
        ))}

        <div className='border-t pt-4 space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span>Subtotal</span>
            <Currency amount={total} />
          </div>
          <div className='flex justify-between'>
            <span>Shipping</span>
            <Currency amount={shippingCost} />
          </div>
          <div className='flex justify-between'>
            <span>VAT (15%)</span>
            <Currency amount={vat} />
          </div>
        </div>

        <div className='border-t pt-4 flex justify-between font-semibold text-lg'>
          <span>Total</span>
          <Currency amount={grandTotal} />
        </div>

        <Button onClick={onPay} disabled={loading} className='w-full mt-4'>
          {loading ? "Processing…" : "Continue to Payment"}
        </Button>
        {error && <p className='text-red-600 mt-2'>{error}</p>}
      </div>
    </div>
  );
}
