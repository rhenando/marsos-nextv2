"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Currency from "@/components/global/CurrencySymbol";
import { db } from "@/firebase/config";
import { doc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartNegotiation } from "@/hooks/useCartNegotiation";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";

const CartPage = () => {
  const { removeCartItem, cartItemCount } = useCart();
  const [groupedItems, setGroupedItems] = useState({});
  const { currentUser } = useAuth();
  const router = useRouter();
  const { startNegotiation } = useCartNegotiation();
  const { placeOrder, isPlacing } = usePlaceOrder();

  useEffect(() => {
    if (!currentUser) return;

    const q = collection(db, "carts", currentUser.uid, "items");
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const grouped = items.reduce((acc, item) => {
        const key = item.supplierId || "unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
      setGroupedItems(grouped);
    });

    return () => unsub();
  }, [currentUser]);

  const handleQuantityChange = async (itemId, value) => {
    if (value <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const itemRef = doc(db, "carts", currentUser.uid, "items", itemId);
    await setDoc(
      itemRef,
      {
        quantity: parseFloat(value),
        subtotal: parseFloat(value),
      },
      { merge: true }
    );
  };

  const handleNegotiate = async (supplierId, items) => {
    if (!currentUser) return toast.error("Please login to negotiate.");
    const chatId = `cart_${currentUser.uid}_${supplierId}`;
    const chatRef = doc(db, "cartChats", chatId);

    try {
      await setDoc(
        chatRef,
        {
          buyerId: currentUser.uid,
          supplierId,
          createdAt: new Date(),
          status: "pending",
          cartSnapshot: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            deliveryLocation: item.deliveryLocation,
            originalPrice: item.price,
            originalSubtotal: item.subtotal,
          })),
        },
        { merge: true }
      );

      router.push(`/chat/cart/${chatId}`);
    } catch (err) {
      console.error("❌ Negotiation chat error:", err);
      toast.error("Failed to initiate negotiation.");
    }
  };

  if (cartItemCount === 0) {
    return (
      <div className='text-center py-12'>
        <h2 className='text-xl font-semibold text-gray-600'>
          Your cart is empty 🛒
        </h2>
        <p className='mt-2 text-gray-500'>
          Explore our products and add some items!
        </p>
        <Button
          className='mt-4 bg-[#2c6449] text-white text-sm py-2 px-3'
          onClick={() => router.push("/products")}
        >
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div id='cart-page' className='max-w-6xl mx-auto px-4 py-10'>
      <h1 className='text-2xl font-bold mb-6 text-[#2c6449]'>Your Cart</h1>

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
            className='border rounded-xl shadow-sm mb-10 p-6 bg-white'
          >
            <h2 className='text-lg font-semibold mb-4 text-[#2c6449]'>
              Supplier: {supplierName}
            </h2>

            <div className='space-y-6'>
              {items.map((item) => (
                <div
                  key={item.id}
                  className='flex flex-col md:flex-row gap-4 items-center border-b pb-4'
                >
                  <img
                    src={item.productImage || "https://via.placeholder.com/100"}
                    alt={item.productName}
                    className='w-24 h-24 object-cover rounded border'
                  />
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-800'>
                      {item.productName}
                    </h3>
                    <div className='flex gap-2 items-center text-sm text-gray-600'>
                      <label>Qty:</label>
                      <input
                        type='number'
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            parseInt(e.target.value)
                          )
                        }
                        className='border px-2 py-1 rounded w-18'
                      />
                      <span>×</span>
                      <Currency amount={item.price} />
                    </div>
                    <p className='text-sm text-gray-500'>
                      Size: {item.size || "—"} | Color: {item.color || "—"} |
                      Location: {item.deliveryLocation}
                    </p>
                    <p className='text-sm font-medium text-[#2c6449] mt-1'>
                      Subtotal: <Currency amount={item.subtotal} />
                    </p>
                  </div>
                  <Button
                    variant='destructive'
                    className='text-sm py-2 px-3'
                    onClick={() => removeCartItem(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className='flex flex-col md:flex-row justify-between items-start md:items-center mt-6 pt-4 border-t gap-4'>
              <div className='text-sm text-gray-700 w-full md:w-auto'>
                <div className='grid grid-cols-2 gap-y-1 gap-x-6'>
                  <span className='font-medium'>Subtotal:</span>
                  <span>
                    <Currency amount={subtotal} />
                  </span>
                  <span className='font-medium'>Shipping:</span>
                  <span>
                    <Currency amount={shipping} />
                  </span>
                  <span className='font-medium'>VAT (15%):</span>
                  <span>
                    <Currency amount={vat} />
                  </span>
                  <span className='font-semibold text-lg'>Total:</span>
                  <span className='font-semibold text-lg text-[#2c6449]'>
                    <Currency amount={total} />
                  </span>
                </div>
              </div>

              <div className='flex flex-col md:flex-row gap-2 w-full md:w-auto'>
                <Button
                  onClick={() => router.push("/checkout")}
                  className='bg-[#2c6449] text-white text-sm py-2 px-3 w-full md:w-auto'
                >
                  Proceed to Checkout
                </Button>

                <Button
                  variant='outline'
                  className='text-[#2c6449] border-[#2c6449] text-sm py-2 px-3 w-full md:w-auto'
                  onClick={() => handleNegotiate(supplierId, items)}
                >
                  Contact Supplier to Negotiate
                </Button>
                <Button
                  variant='outline'
                  className='text-sm py-2 px-3 w-full md:w-auto'
                  onClick={() => router.push("/review-order")}
                >
                  Review Order
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartPage;
