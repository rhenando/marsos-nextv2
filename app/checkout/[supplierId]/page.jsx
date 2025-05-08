// app/checkout/[supplierId]/page.jsx
"use client";

import CheckoutForm from "@/components/checkout/CheckoutForm";
import { useCart } from "@/context/CartContext";
import { useParams } from "next/navigation";

export default function CheckoutPage() {
  const { supplierId } = useParams();
  const { cartItems } = useCart();

  const items = cartItems.filter((i) => i.supplierId === supplierId);
  const total = items.reduce(
    (sum, i) => sum + (i.subtotal || i.price * i.quantity),
    0
  );

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <h1 className='text-3xl font-bold mb-6'>
        Checkout for Supplier: {supplierId}
      </h1>
      <CheckoutForm supplierId={supplierId} items={items} total={total} />
    </div>
  );
}
