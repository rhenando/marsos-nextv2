"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config"; // Adjust path if needed
import { useAuth } from "./AuthContext"; // Adjust path if needed

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { currentUser, role: userRole } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    if (!currentUser || userRole === "admin") {
      setCartItems([]);
      setCartItemCount(0);
      return;
    }

    const cartRef = doc(db, "carts", currentUser.uid);
    const unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
      if (snapshot.exists()) {
        const cartData = snapshot.data();
        setCartItems(cartData.items || []);
        setCartItemCount(cartData.items ? cartData.items.length : 0);
      } else {
        setCartItems([]);
        setCartItemCount(0);
      }
    });

    return () => unsubscribeCart();
  }, [currentUser, userRole]);

  const isCheckoutDisabled = cartItems.some(
    (item) =>
      !item.price || isNaN(item.price) || !item.quantity || isNaN(item.quantity)
  );

  const clearCartInFirestore = async () => {
    if (!currentUser) return;

    const cartRef = doc(db, "carts", currentUser.uid);

    try {
      const cartSnapshot = await getDoc(cartRef);
      if (cartSnapshot.exists()) {
        await updateDoc(cartRef, { items: [] });
      } else {
        await setDoc(cartRef, { items: [] });
      }

      console.log("✅ Cart cleared successfully!");
      setCartItems([]);
      setCartItemCount(0);
    } catch (error) {
      console.error("🔥 Error clearing cart:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        cartItemCount,
        isCheckoutDisabled,
        clearCartInFirestore,
        userRole,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
