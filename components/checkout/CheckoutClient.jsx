// components/checkout/CheckoutClient.jsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DeliveryAddress } from "./DeliveryAddress";
import { PaymentMethod } from "./PaymentMethod";
import { OrderSummary } from "./OrderSummary";

export default function CheckoutClient({ supplierId }) {
  const [openSection, setOpenSection] = React.useState(null);
  const [selectedAddress, setSelectedAddress] = React.useState(null);
  const [selectedMethod, setSelectedMethod] = React.useState("");
  const [selectedPaymentId, setSelectedPaymentId] = React.useState("");

  const deliveryValid = Boolean(selectedAddress);
  const paymentValid = Boolean(selectedMethod && selectedPaymentId);

  // If someone somehow hits this page with no items for that supplier, redirect back
  const { cartItems } = require("@/context/CartContext").useCart();
  const router = useRouter();
  React.useEffect(() => {
    if (!cartItems.some((i) => i.supplierId === supplierId)) {
      router.push("/cart");
    }
  }, [cartItems, supplierId, router]);

  return (
    <div className='min-h-screen bg-gray-50 text-base'>
      <header className='bg-black text-white py-3'>
        <h1 className='text-center uppercase text-lg font-medium'>Checkout</h1>
      </header>

      <div className='max-w-5xl mx-auto grid md:grid-cols-5 gap-4 py-8 px-4'>
        <div className='md:col-span-3 space-y-6'>
          <DeliveryAddress
            openSection={openSection}
            setOpenSection={setOpenSection}
            selectedAddress={selectedAddress}
            setSelectedAddress={setSelectedAddress}
          />

          <PaymentMethod
            openSection={openSection}
            setOpenSection={setOpenSection}
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
            selectedPaymentId={selectedPaymentId}
            setSelectedPaymentId={setSelectedPaymentId}
          />
        </div>

        <OrderSummary
          supplierId={supplierId}
          deliveryValid={deliveryValid}
          paymentValid={paymentValid}
        />
      </div>
    </div>
  );
}
