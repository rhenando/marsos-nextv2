import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const usePlaceOrder = () => {
  const { clearCart } = useCart();
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
        const vat = (subtotal + shipping) * 0.15;
        const total = subtotal + shipping + vat;

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

      await clearCart();
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
