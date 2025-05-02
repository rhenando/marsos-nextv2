"use client";

import { useState } from "react";
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

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { clearCart } = useCart();
  const [groupedItems, setGroupedItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const router = useRouter();

  const fetchCartItems = async () => {
    if (!currentUser) return toast.error("Please login to proceed.");

    setIsLoading(true);
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
      console.error("\u274C Error fetching cart items:", err);
      toast.error("Failed to load cart.");
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!currentUser) return toast.error("Please log in to place an order.");
    if (!deliveryAddress.trim()) {
      toast.error("Please provide a delivery address.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      for (const [supplierId, items] of Object.entries(groupedItems)) {
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

        await addDoc(collection(db, "orders"), {
          buyerId: currentUser.uid,
          supplierId,
          items,
          subtotal,
          shipping,
          vat,
          total,
          paymentMethod,
          deliveryAddress,
          orderStatus: "pending",
          createdAt: serverTimestamp(),
        });
      }

      await clearCart();
      toast.success("Order placed successfully!");
      router.push("/orders");
    } catch (err) {
      console.error("\u274C Error placing order:", err);
      toast.error("Failed to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <h1 className='text-2xl font-bold text-[#2c6449] mb-6'>Checkout</h1>

      <Button
        onClick={fetchCartItems}
        className='text-sm bg-[#2c6449] text-white py-2 px-4 mb-6'
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Load Cart Items"}
      </Button>

      {Object.entries(groupedItems).length === 0 && !isLoading && (
        <p className='text-gray-500'>No items to checkout yet. Click above.</p>
      )}

      {Object.entries(groupedItems).map(([supplierId, items]) => {
        const supplierName = items[0].supplierName || "Unknown Supplier";
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
          <div
            key={supplierId}
            className='border rounded-lg shadow-sm p-6 mb-8 bg-white'
          >
            <h2 className='text-lg font-semibold mb-2 text-[#2c6449]'>
              Supplier: {supplierName}
            </h2>

            <ul className='divide-y'>
              {items.map((item) => (
                <li key={item.id} className='py-2'>
                  <div className='flex justify-between items-center'>
                    <div>
                      <p className='font-medium'>{item.productName}</p>
                      <p className='text-sm text-gray-500'>
                        Qty: {item.quantity} × <Currency amount={item.price} />
                      </p>
                    </div>
                    <p className='text-sm font-medium text-[#2c6449]'>
                      <Currency amount={item.subtotal} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className='border-t mt-4 pt-4 text-sm text-gray-700'>
              <div className='flex justify-between'>
                <span>Subtotal:</span>
                <Currency amount={subtotal} />
              </div>
              <div className='flex justify-between'>
                <span>Shipping:</span>
                <Currency amount={shipping} />
              </div>
              <div className='flex justify-between'>
                <span>VAT (15%):</span>
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

      {Object.entries(groupedItems).length > 0 && (
        <div className='border rounded-lg p-6 bg-white shadow-sm mb-10'>
          <h2 className='text-lg font-semibold text-[#2c6449] mb-4'>
            Confirm Your Order
          </h2>

          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Payment Method
            </label>
            <select
              className='w-full border rounded px-3 py-2 text-sm'
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value='card'>Credit/Debit Card</option>
              <option value='cod'>Cash on Delivery</option>
              <option value='applepay'>Apple Pay</option>
            </select>
          </div>

          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Delivery Address
            </label>
            <textarea
              className='w-full border rounded px-3 py-2 text-sm'
              rows={3}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder='Enter delivery address here'
            ></textarea>
          </div>

          <Button
            onClick={placeOrder}
            disabled={isPlacingOrder}
            className='bg-[#2c6449] text-white text-sm py-2 px-4 w-full md:w-auto'
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order Now"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
