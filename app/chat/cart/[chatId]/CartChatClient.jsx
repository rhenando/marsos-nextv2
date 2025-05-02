"use client";

import ChatMessages from "@/components/chat/ChatMessages";
import Currency from "@/components/global/CurrencySymbol";
import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function CartChatClient({ chatId }) {
  const { currentUser } = useAuth();
  const [chatMeta, setChatMeta] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const fetchChat = async () => {
      const ref = doc(db, "cartChats", chatId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setChatMeta({
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || null,
        });
      }
    };
    if (chatId) fetchChat();
  }, [chatId]);

  useEffect(() => {
    if (!chatMeta?.buyerId || !chatMeta?.supplierId) return;

    const q = query(
      collection(db, "carts", chatMeta.buyerId, "items"),
      where("supplierId", "==", chatMeta.supplierId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCartItems(items);
    });

    return () => unsub();
  }, [chatMeta]);

  const handleChange = async (itemId, field, value) => {
    const parsed =
      field === "quantity" || field === "price" || field === "shippingCost"
        ? parseFloat(value)
        : value;

    const itemRef = doc(db, "carts", chatMeta.buyerId, "items", itemId);
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const updates = {
      [field]: parsed,
    };

    if (field === "quantity" || field === "price") {
      const newQty = field === "quantity" ? parsed : item.quantity;
      const newPrice = field === "price" ? parsed : item.price;
      updates.subtotal = newQty * newPrice;
    }

    await updateDoc(itemRef, updates);
  };

  const isBuyer = currentUser?.uid === chatMeta?.buyerId;
  const isSupplier = currentUser?.uid === chatMeta?.supplierId;

  if (!chatMeta) return null;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      <div className='col-span-1 border rounded p-4 bg-white'>
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          Negotiated Items
        </h2>
        {cartItems.length === 0 ? (
          <p className='text-sm text-red-500'>No cart items found.</p>
        ) : (
          <div className='space-y-3 text-sm text-gray-800'>
            {cartItems.map((item) => (
              <div key={item.id} className='border-b pb-2'>
                <p className='font-medium'>{item.productName}</p>

                <div className='flex items-center gap-2 mt-1'>
                  <span>Qty:</span>
                  {isBuyer ? (
                    <Input
                      type='number'
                      min={1}
                      className='w-16 h-7 text-sm'
                      value={item.quantity}
                      onChange={(e) =>
                        handleChange(item.id, "quantity", e.target.value)
                      }
                    />
                  ) : (
                    <span>{item.quantity}</span>
                  )}

                  <span>×</span>
                  {isSupplier ? (
                    <Input
                      type='number'
                      min={0.01}
                      step={0.01}
                      className='w-20 h-7 text-sm'
                      value={item.price}
                      onChange={(e) =>
                        handleChange(item.id, "price", e.target.value)
                      }
                    />
                  ) : (
                    <Currency amount={item.price} />
                  )}
                </div>

                <div className='flex items-center gap-2 mt-1'>
                  <span>Shipping:</span>
                  {isSupplier ? (
                    <Input
                      type='number'
                      min={0}
                      step={0.01}
                      className='w-24 h-7 text-sm'
                      value={item.shippingCost || 0}
                      onChange={(e) =>
                        handleChange(item.id, "shippingCost", e.target.value)
                      }
                    />
                  ) : (
                    <Currency amount={item.shippingCost || 0} />
                  )}
                </div>

                <p className='mt-1 text-xs text-gray-600'>
                  Size: {item.size || "—"} | Color: {item.color || "—"} |
                  Delivery: {item.deliveryLocation}
                </p>

                <p className='text-sm font-bold text-[#2c6449]'>
                  Subtotal: <Currency amount={item.subtotal} />
                </p>
              </div>
            ))}

            {/* ✅ Totals Summary */}
            <div className='pt-4 mt-4 border-t space-y-1 text-sm font-medium'>
              {(() => {
                const subtotal = cartItems.reduce(
                  (acc, item) => acc + (item.subtotal || 0),
                  0
                );
                const shipping = cartItems.reduce(
                  (acc, item) => acc + (item.shippingCost || 0),
                  0
                );
                const vat = (subtotal + shipping) * 0.15;
                const total = subtotal + shipping + vat;

                return (
                  <>
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
                    <div className='flex justify-between text-[#2c6449] text-base font-bold pt-2 border-t'>
                      <span>Total:</span>
                      <Currency amount={total} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <div className='col-span-2 flex flex-col'>
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          Chat with Supplier
        </h2>
        <ChatMessages chatId={chatId} chatMeta={chatMeta} />
      </div>
    </div>
  );
}
