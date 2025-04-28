"use client";

import { useState, useEffect } from "react";
import "../i18n"; // Initialize i18n early
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/header/Header";
import StickySearchBar from "../components/header/StickySearchBar"; // 🚀 New import
import { LoadingProvider } from "@/context/LoadingContext";
import GlobalLoading from "@/components/global/GlobalLoading";

export default function RootProvider({ children }) {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <LoadingProvider>
          <GlobalLoading />
          {!showSticky && <Header />}
          {showSticky && <StickySearchBar />}
          {children}
        </LoadingProvider>
        <ToastContainer />
      </CartProvider>
    </AuthProvider>
  );
}
