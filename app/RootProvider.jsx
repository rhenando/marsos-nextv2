"use client";

import { useState, useEffect } from "react";
import "../i18n";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import {
  HeaderPaddingProvider,
  useHeaderPadding,
} from "@/context/HeaderPaddingContext";
import { LoadingProvider } from "../context/LoadingContext";
import GlobalLoading from "@/components/global/GlobalLoading";
import Header from "../components/header/Header";
import StickySearchBar from "../components/header/StickySearchBar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Lenis from "@studio-freight/lenis"; // 🚀 NEW import

function AppLayout({ children }) {
  const [showSticky, setShowSticky] = useState(false);
  const { needsPadding } = useHeaderPadding();

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

  // 🚀 NEW useEffect to initialize Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
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
          <LoadingProvider>
            <GlobalLoading />
            <AppLayout>{children}</AppLayout>
          </LoadingProvider>
        </HeaderPaddingProvider>
      </CartProvider>
    </AuthProvider>
  );
}
