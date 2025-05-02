import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    const q = collection(db, "carts", currentUser.uid, "items");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCartItems(items);
      setCartItemCount(items.length);
    });

    return () => unsubscribe();
  }, [authLoading, currentUser]);

  const addToCart = async (item) => {
    if (!currentUser) return;

    const q = query(
      collection(db, "carts", currentUser.uid, "items"),
      where("productId", "==", item.productId),
      where("size", "==", item.size || ""),
      where("color", "==", item.color || ""),
      where("deliveryLocation", "==", item.deliveryLocation)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      const existingData = existingDoc.data();
      const updatedQty = existingData.quantity + item.quantity;

      await updateDoc(
        doc(db, "carts", currentUser.uid, "items", existingDoc.id),
        {
          quantity: updatedQty,
          subtotal: updatedQty * item.price,
          shippingCost: item.shippingCost || 0,
        }
      );
    } else {
      const itemId = item.productId + "-" + Date.now(); // Ensure unique key
      await setDoc(doc(db, "carts", currentUser.uid, "items", itemId), {
        ...item,
        buyerId: currentUser.uid,
        createdAt: new Date(),
      });
    }
  };

  const removeCartItem = async (itemId) => {
    await deleteDoc(doc(db, "carts", currentUser.uid, "items", itemId));
  };

  const clearCart = async () => {
    const q = collection(db, "carts", currentUser.uid, "items");
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "carts", currentUser.uid, "items", docSnap.id))
    );
    await Promise.all(promises);
  };

  const isCheckoutDisabled = cartItems.some(
    (item) =>
      !item.price || isNaN(item.price) || !item.quantity || isNaN(item.quantity)
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartItemCount,
        addToCart,
        removeCartItem,
        clearCart,
        isCheckoutDisabled,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
