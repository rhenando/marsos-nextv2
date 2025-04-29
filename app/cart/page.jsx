"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useTranslation } from "react-i18next";
import Currency from "@/components/global/CurrencySymbol";
import ReviewOrderModal from "@/components/review-order/ReviewOrder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CartPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const { cartItems, setCartItems, isCheckoutDisabled } = useCart();
  const [supplierNames, setSupplierNames] = useState({});

  const showNotification = (type, message) => {
    if (type === "success") toast.success(message);
    else toast.error(message);
  };

  useEffect(() => {
    const fetchSupplierNames = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const namesMap = {};
        snapshot.forEach((doc) => {
          const user = doc.data();
          if (user.role === "supplier") {
            namesMap[doc.id] =
              user.displayName || user.name || "Unnamed Supplier";
          }
        });
        setSupplierNames(namesMap);
      } catch (error) {
        console.error("Error fetching supplier names:", error);
      }
    };
    fetchSupplierNames();
  }, []);

  const groupedBySupplier = cartItems.reduce((groups, item) => {
    const supplierId = item.supplierId;
    if (!groups[supplierId]) groups[supplierId] = [];
    groups[supplierId].push(item);
    return groups;
  }, {});

  const safeValue = (val) => (isNaN(val) || val === null ? 0 : val);

  const handleQuantityChange = (cartId, change) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const handleQuantityManualChange = (cartId, value) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId
          ? { ...item, tempQuantity: value.replace(/\D/g, "") }
          : item
      )
    );
  };

  const handleQuantityBlur = (cartId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId
          ? {
              ...item,
              quantity:
                item.tempQuantity === "" || item.tempQuantity === undefined
                  ? item.quantity
                  : parseInt(item.tempQuantity, 10),
              tempQuantity: undefined,
            }
          : item
      )
    );
  };

  const handleRemoveItem = async (cartId) => {
    const updatedItems = cartItems.filter((item) => item.cartId !== cartId);
    setCartItems(updatedItems);
    try {
      await updateDoc(doc(db, "carts", currentUser.uid), {
        items: updatedItems,
      });
      showNotification("success", "Item successfully removed.");
    } catch {
      showNotification("error", "Failed to update cart.");
    }
  };

  const handleApplyCoupon = () => {
    const validCoupons = { DISCOUNT10: 10, SAVE20: 20 };
    if (validCoupons[couponCode]) {
      setDiscount(validCoupons[couponCode]);
      showNotification("success", `You saved SR ${validCoupons[couponCode]}!`);
    } else {
      setDiscount(0);
      showNotification("error", "This code is not valid.");
    }
    setCouponCode("");
    setShowCouponInput(false);
  };

  const handleContactSupplier = async (supplierId, items) => {
    if (!currentUser) return router.push("/user-login");
    const chatDocId = `chat_${currentUser.uid}_${supplierId}_CART`;
    const chatRef = doc(db, "cartChats", chatDocId);

    try {
      const chatSnapshot = await getDoc(chatRef);
      const buyerName = currentUser.displayName || "Unknown Buyer";
      if (chatSnapshot.exists()) {
        await updateDoc(chatRef, { cartItems: items });
      } else {
        await setDoc(chatRef, {
          chatId: chatDocId,
          buyerId: currentUser.uid,
          buyerName,
          supplierId,
          cartItems: items,
          messages: [],
          createdAt: serverTimestamp(),
        });
      }
      router.push(`/cart-chat/${chatDocId}`);
    } catch (error) {
      showNotification("error", "Failed to contact supplier.");
    }
  };

  const handleReviewOrder = (supplierId) => {
    if (!supplierId)
      return showNotification("error", "Supplier ID is missing.");
    setSelectedSupplierId(supplierId);
    setIsReviewModalOpen(true);
  };

  if (!cartItems.length)
    return (
      <p className='text-center text-muted-foreground py-10'>
        {t("cart.emptyMessage")}
      </p>
    );

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <h2 className='text-lg font-semibold text-center mb-6'>
        Your Cart ({cartItems.length} items)
      </h2>

      {Object.entries(groupedBySupplier).map(([supplierId, items]) => {
        const supplierSubtotal = items.reduce(
          (sum, item) => sum + safeValue(item.price) * safeValue(item.quantity),
          0
        );
        const supplierShipping = items.reduce(
          (sum, item) => sum + safeValue(item.shippingCost),
          0
        );
        const supplierTax = (supplierSubtotal + supplierShipping) * 0.15;
        const supplierTotal =
          supplierSubtotal + supplierShipping + supplierTax - discount;

        return (
          <div key={supplierId} className='mb-10'>
            <h3 className='font-bold text-sm text-gray-800 mb-3'>
              Supplier: {supplierNames[supplierId] || supplierId}
            </h3>

            {/* --- Mobile View Cards --- */}
            <div className='md:hidden space-y-4'>
              {items.map((item) => (
                <div
                  key={item.cartId}
                  className='border rounded p-4 shadow-sm bg-white'
                >
                  <div className='flex gap-3 mb-2'>
                    <img
                      src={
                        item.mainImageUrl || "https://via.placeholder.com/60"
                      }
                      alt={item.name}
                      className='w-16 h-16 object-cover rounded'
                    />
                    <div>
                      <p className='font-semibold capitalize'>{item.name}</p>
                      <p className='text-xs text-gray-500'>
                        Size: {item.size} | Color: {item.color}
                      </p>
                    </div>
                  </div>
                  <p className='text-sm'>
                    Price: <Currency amount={safeValue(item.price)} />
                  </p>
                  <p className='text-sm'>
                    Shipping: <Currency amount={safeValue(item.shippingCost)} />
                  </p>
                  <p className='text-sm'>
                    Total:{" "}
                    {isNaN(item.price * item.quantity) ? (
                      <span
                        className='text-red-600 underline cursor-pointer'
                        onClick={() =>
                          handleContactSupplier(item.supplierId, [item])
                        }
                      >
                        Contact Supplier
                      </span>
                    ) : (
                      <Currency amount={item.price * item.quantity} />
                    )}
                  </p>
                  <div className='flex items-center gap-2 mt-3'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleQuantityChange(item.cartId, -1)}
                    >
                      -
                    </Button>
                    <Input
                      className='w-12 text-center'
                      value={item.tempQuantity ?? item.quantity}
                      onChange={(e) =>
                        handleQuantityManualChange(item.cartId, e.target.value)
                      }
                      onBlur={() => handleQuantityBlur(item.cartId)}
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleQuantityChange(item.cartId, 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-red-500 ml-auto px-2'
                      onClick={() => handleRemoveItem(item.cartId)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* --- Shared Summary Section --- */}
            <div className='mt-4 border rounded p-4 text-sm bg-gray-50'>
              <div className='flex justify-between mb-1'>
                <span>Subtotal</span>
                <span>
                  <Currency amount={supplierSubtotal} />
                </span>
              </div>
              <div className='flex justify-between mb-1'>
                <span>Shipping</span>
                <Currency amount={supplierShipping} />
              </div>
              <div className='flex justify-between mb-1'>
                <span>VAT (15%)</span>
                <Currency amount={supplierTax} />
              </div>
              <div className='flex justify-between mb-1'>
                <span>Discount</span>
                <span>
                  - <Currency amount={discount} />
                </span>
              </div>
              <div className='flex justify-between font-semibold text-base mt-2'>
                <span>Total</span>
                <span>
                  {supplierTotal > 0 ? (
                    <Currency amount={supplierTotal} />
                  ) : (
                    "Contact Supplier"
                  )}
                </span>
              </div>

              {/* CTA Buttons */}
              <div className='mt-4 flex flex-col gap-2'>
                {showCouponInput && (
                  <div className='flex gap-2'>
                    <Input
                      type='text'
                      placeholder='Enter Coupon Code'
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button onClick={handleApplyCoupon}>Apply</Button>
                  </div>
                )}

                <Button
                  variant='link'
                  className='text-xs text-[#2c6449] px-0'
                  onClick={() => setShowCouponInput((prev) => !prev)}
                >
                  {showCouponInput ? "Hide Coupon" : "Add Coupon"}
                </Button>

                <div className='flex flex-col md:flex-row gap-2 mt-2'>
                  <Button
                    disabled={isCheckoutDisabled}
                    className='bg-[#2c6449] text-white'
                    onClick={() =>
                      router.push(`/checkout?supplierId=${supplierId}`)
                    }
                  >
                    Checkout
                  </Button>

                  <Button
                    variant='destructive'
                    onClick={() => handleContactSupplier(supplierId, items)}
                  >
                    Contact Supplier
                  </Button>

                  <Button
                    variant='secondary'
                    onClick={() => handleReviewOrder(supplierId)}
                  >
                    Review Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <ReviewOrderModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        supplierId={selectedSupplierId}
      />

      <ToastContainer
        position='top-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='light'
      />
    </div>
  );
}
