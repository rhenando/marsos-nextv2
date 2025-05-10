"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { clearCartItems } from "@/store/cartSlice";

export const usePlaceOrder = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isPlacing, setIsPlacing] = useState(false);

  const placeOrder = async (groupedItems, userId) => {
    setIsPlacing(true);

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
        const vat = Number(((subtotal + shipping) * 0.15).toFixed(2));
        const total = Number((subtotal + shipping + vat).toFixed(2));

        await addDoc(collection(db, "orders"), {
          buyerId: userId,
          supplierId,
          items,
          subtotal,
          shipping,
          vat,
          total,
          orderStatus: "pending",
          createdAt: serverTimestamp(),
        });
      }

      // Clear cart in Redux
      await dispatch(clearCartItems(userId)).unwrap();

      toast.success("Order placed successfully!");
      router.push("/orders");
    } catch (error) {
      console.error("❌ Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  return { placeOrder, isPlacing };
};
