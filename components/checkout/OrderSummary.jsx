// components/checkout/OrderSummary.jsx
"use client";

import * as React from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Currency from "@/components/global/CurrencySymbol";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";

export function OrderSummary({ supplierId, deliveryValid, paymentValid }) {
  const { cartItems, removeCartItem } = useCart();
  const { currentUser } = useAuth();
  const router = useRouter();
  const { placeOrder, isPlacing } = usePlaceOrder();

  // 1) Filter just this supplier’s items
  const items = React.useMemo(
    () => cartItems.filter((i) => i.supplierId === supplierId),
    [cartItems, supplierId]
  );

  if (items.length === 0) {
    return (
      <aside className='md:col-span-2 p-4 text-center'>
        <p>No items found for this supplier.</p>
      </aside>
    );
  }

  // 2) Compute totals for these items
  const { subtotal, shipping, vat, total } = React.useMemo(() => {
    const sub = items.reduce((s, i) => s + (i.subtotal || 0), 0);
    const ship = items.reduce((s, i) => s + (i.shippingCost || 0), 0);
    const v = (sub + ship) * 0.15;
    return { subtotal: sub, shipping: ship, vat: v, total: sub + ship + v };
  }, [items]);

  // 3) Checkout handler for just these items
  const handleCheckout = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to place an order.");
      return router.push("/login");
    }
    if (!deliveryValid || !paymentValid) {
      toast.error("Select delivery & payment first.");
      return;
    }

    try {
      await placeOrder({ userId: currentUser.uid, items });
      toast.success("Order placed!");
      // remove only these items
      items.forEach((i) => removeCartItem(i.id));
      router.push("/orders");
    } catch (err) {
      console.error("❌ Checkout error:", err);
      toast.error("Failed to place order.");
    }
  };

  const supplierName = items[0].supplierName || "Supplier";

  return (
    <aside className='md:col-span-2 space-y-4'>
      <div className='bg-white p-4 rounded border sticky top-16 space-y-4'>
        <h3 className='text-lg font-semibold text-[#2c6449]'>{supplierName}</h3>

        <div className='space-y-2 max-h-48 overflow-y-auto'>
          {items.map((item) => (
            <div key={item.id} className='flex justify-between items-start'>
              <div className='flex-1'>
                <p className='font-medium'>{item.productName}</p>
                <p className='text-sm text-gray-600'>
                  {item.quantity} × <Currency amount={item.price} />
                </p>
                <p className='text-sm text-gray-500'>
                  Size: {item.size || "—"} | Color: {item.color || "—"}
                </p>
              </div>
              <p className='font-medium text-[#2c6449]'>
                <Currency amount={item.subtotal} />
              </p>
            </div>
          ))}
        </div>

        <hr />

        <div className='space-y-1 text-sm'>
          <div className='flex justify-between'>
            <span>Subtotal</span>
            <Currency amount={subtotal} />
          </div>
          <div className='flex justify-between'>
            <span>Shipping</span>
            <Currency amount={shipping} />
          </div>
          <div className='flex justify-between'>
            <span>VAT (15%)</span>
            <Currency amount={vat} />
          </div>
          <div className='flex justify-between font-semibold text-lg'>
            <span>Total</span>
            <Currency amount={total} />
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={
            isPlacing || items.length === 0 || !deliveryValid || !paymentValid
          }
          className='w-full bg-[#2c6449] text-white'
        >
          {isPlacing ? "Processing…" : "Checkout"}
        </Button>

        <Button
          variant='outline'
          onClick={() => router.push("/cart")}
          className='w-full text-[#2c6449] border-[#2c6449]'
        >
          Back to Cart
        </Button>
      </div>
    </aside>
  );
}
