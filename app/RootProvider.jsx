"use client";

import { useState, useEffect } from "react";
import "../i18n";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import {
  HeaderPaddingProvider,
  useHeaderPadding,
} from "@/context/HeaderPaddingContext"; // ✅ New
import { LoadingProvider } from "@/context/LoadingContext";
import GlobalLoading from "@/components/global/GlobalLoading";
import Header from "../components/header/Header";
import StickySearchBar from "../components/header/StickySearchBar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AppLayout({ children }) {
  const [showSticky, setShowSticky] = useState(false);
  const { needsPadding } = useHeaderPadding(); // ✅ Read from context

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
    <>
      {/* Header or Sticky */}
      <div className='fixed top-0 left-0 w-full z-[9999] transition-all duration-500 ease-in-out'>
        {!showSticky ? <Header /> : <StickySearchBar />}
      </div>

      {/* Main content with dynamic padding */}
      <div className={needsPadding ? "pt-36" : ""}>{children}</div>

      <ToastContainer />
    </>
  );
}

export default function RootProvider({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <HeaderPaddingProvider>
          {" "}
          {/* ✅ Wrap */}
          <LoadingProvider>
            <GlobalLoading />
            <AppLayout>{children}</AppLayout> {/* ✅ Clean separation */}
          </LoadingProvider>
        </HeaderPaddingProvider>
      </CartProvider>
    </AuthProvider>
  );
}
