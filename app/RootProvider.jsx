"use client";

import { useState, useEffect } from "react";
import "../i18n";

import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { LoadingProvider } from "../context/LoadingContext";
import { LocalizationProvider } from "../context/LocalizationContext";

import GlobalLoading from "@/components/global/GlobalLoading";
import Header from "@/components/header/Header";
import StickySearchBar from "@/components/header/StickySearchBar";
import Footer from "@/components/global/Footer";
import RfqModal from "@/components/rfq/Rfq";
import { Toaster } from "@/components/ui/sonner"; // or "@/components/ui/toaster" if using original name

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Lenis from "@studio-freight/lenis";

function AppLayout({ children }) {
  const [showSticky, setShowSticky] = useState(false);
  const [showRFQModal, setShowRFQModal] = useState(false); // ✅ shared RFQ modal state

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
      <div className='sticky top-0 left-0 w-full z-[9999] transition-all duration-500 ease-in-out'>
        {!showSticky ? (
          <Header setShowRFQModal={setShowRFQModal} />
        ) : (
          <StickySearchBar />
        )}
      </div>

      {/* Main content with top padding */}
      <div>
        {children}

        {/* Footer at bottom */}
        <Footer />
      </div>

      {/* Global RFQ Modal */}
      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />

      <ToastContainer />
      <Toaster />
    </>
  );
}

export default function RootProvider({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <LoadingProvider>
          <LocalizationProvider>
            <GlobalLoading />
            <AppLayout>{children}</AppLayout>
          </LocalizationProvider>
        </LoadingProvider>
      </CartProvider>
    </AuthProvider>
  );
}
