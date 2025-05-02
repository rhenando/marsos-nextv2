"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Currency from "@/components/global/CurrencySymbol";
import { Button } from "@/components/ui/button";
import PaymentOptionCard from "@/components/checkout/PaymentOptionCard";

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { clearCart } = useCart();
  const [groupedItems, setGroupedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!currentUser) return toast.error("Please login to proceed.");
      try {
        const querySnapshot = await getDocs(
          collection(db, "carts", currentUser.uid, "items")
        );
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const grouped = items.reduce((acc, item) => {
          const key = item.supplierId || "unknown";
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});
        setGroupedItems(grouped);
      } catch (err) {
        console.error("❌ Error fetching cart items:", err);
        toast.error("Failed to load cart.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartItems();
  }, [currentUser]);

  const placeOrder = async () => {
    if (!currentUser) return toast.error("Please log in to place an order.");
    if (!deliveryAddress.trim())
      return toast.error("Please provide a delivery address.");

    if (paymentMethod === "card") {
      router.push("/checkout/card");
      return;
    }

    if (paymentMethod === "sadad") {
      router.push("/checkout/sadad");
      return;
    }

    if (paymentMethod === "applepay") {
      router.push("/checkout/applepay");
      return;
    }

    if (paymentMethod === "googlepay") {
      router.push("/checkout/googlepay");
      return;
    }
  };

  const steps = ["1. Info", "2. Payment", "3. Confirm"];

  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <h1 className='text-2xl font-bold text-[#2c6449] mb-6'>Checkout</h1>

      <div className='flex justify-between mb-8'>
        {steps.map((label, index) => (
          <div key={index} className='flex-1 text-center'>
            <div
              className={`text-sm font-medium ${
                currentStep === index ? "text-[#2c6449]" : "text-gray-400"
              }`}
            >
              {label}
            </div>
            <div
              className={`h-1 mt-2 ${
                currentStep >= index ? "bg-[#2c6449]" : "bg-gray-200"
              }`}
            />
          </div>
        ))}
      </div>

      {currentStep === 0 && (
        <div className='bg-white p-6 shadow rounded-lg'>
          <h2 className='text-lg font-bold text-[#2c6449] mb-4'>
            Step 1: Shipping Info
          </h2>
          <textarea
            className='w-full border rounded px-3 py-2 text-sm'
            rows={3}
            placeholder='Enter delivery address'
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />

          <label className='flex items-center gap-2 text-sm mt-4'>
            <input
              type='checkbox'
              checked={expressDelivery}
              onChange={(e) => setExpressDelivery(e.target.checked)}
              className='accent-[#2c6449]'
            />
            Request Express Delivery
          </label>

          <p className='text-sm text-gray-600 mt-2 ml-6'>
            {expressDelivery
              ? "Estimated delivery: 1–2 business days"
              : "Estimated delivery: 3–5 business days"}
          </p>

          <Button
            onClick={() => setCurrentStep(1)}
            className='mt-4 bg-[#2c6449] text-white py-2 px-4 text-sm'
          >
            Next
          </Button>
        </div>
      )}

      {currentStep === 1 && (
        <div className='bg-white p-6 shadow rounded-lg'>
          <h2 className='text-lg font-bold text-[#2c6449] mb-4'>
            Step 2: Select Payment Method
          </h2>

          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
            {[
              {
                key: "card",
                label: "Credit/Debit Card",
                multipleIcons: ["/visa.png", "/master.png", "/mada.png"],
              },
              {
                key: "sadad",
                label: "SADAD",
                iconPath: "/sadad.png",
              },
              {
                key: "applepay",
                label: "Apple Pay",
                iconPath: "/applepay.png",
              },
              {
                key: "googlepay",
                label: "Google Pay",
                iconPath: "/googlepay.jpeg",
              },
            ].map((method) => (
              <PaymentOptionCard
                key={method.key}
                iconPath={method.iconPath}
                multipleIcons={method.multipleIcons}
                label={method.label}
                value={method.key}
                selected={paymentMethod === method.key}
                onSelect={setPaymentMethod}
              />
            ))}
          </div>

          <div className='mt-6 flex justify-between'>
            <Button
              variant='outline'
              onClick={() => setCurrentStep(0)}
              className='text-sm'
            >
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep(2)}
              className='bg-[#2c6449] text-white text-sm'
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className='bg-white p-6 shadow rounded-lg'>
          <h2 className='text-lg font-bold text-[#2c6449] mb-4'>
            Step 3: Confirm Order
          </h2>

          {Object.entries(groupedItems).map(([supplierId, items]) => {
            const subtotal = items.reduce(
              (sum, item) => sum + (item.subtotal || 0),
              0
            );
            const shipping = items.reduce(
              (sum, item) => sum + (item.shippingCost || 0),
              0
            );
            const vat = (subtotal + shipping) * 0.15;
            const total = subtotal + shipping + vat;

            return (
              <div key={supplierId} className='mb-6 border-b pb-4'>
                <p className='font-medium text-[#2c6449] mb-1'>
                  Supplier: {items[0].supplierName || "Unknown"}
                </p>
                <ul className='text-sm text-gray-700 space-y-1'>
                  {items.map((item) => (
                    <li key={item.id}>
                      {item.productName} × {item.quantity} —{" "}
                      <Currency amount={item.subtotal} />
                    </li>
                  ))}
                </ul>
                <div className='text-sm text-gray-700 mt-2 space-y-1'>
                  <div className='flex justify-between'>
                    <span>Subtotal:</span>
                    <Currency amount={subtotal} />
                  </div>
                  <div className='flex justify-between'>
                    <span>Shipping:</span>
                    <Currency amount={shipping} />
                  </div>
                  <div className='flex justify-between'>
                    <span>VAT:</span>
                    <Currency amount={vat} />
                  </div>
                  <div className='flex justify-between font-semibold text-[#2c6449] text-base mt-2'>
                    <span>Total:</span>
                    <Currency amount={total} />
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            onClick={placeOrder}
            disabled={isPlacingOrder}
            className='w-full bg-[#2c6449] text-white text-sm py-2 px-4'
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order Now"}
          </Button>
          <Button
            variant='outline'
            onClick={() => setCurrentStep(1)}
            className='w-full mt-3 text-sm'
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
