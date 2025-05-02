"use client";

import { useState, useEffect } from "react";
import "../i18n";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { LoadingProvider } from "../context/LoadingContext";
import { LocalizationProvider } from "../context/LocalizationContext";

import GlobalLoading from "@/components/global/GlobalLoading";
import Header from "@/components/header/Header";
import StickySearchBar from "@/components/header/StickySearchBar";
import Footer from "@/components/global/Footer";
import RfqModal from "@/components/rfq/Rfq";
import { Toaster } from "@/components/ui/sonner";

import Lenis from "@studio-freight/lenis";
import { AnimatePresence, motion } from "framer-motion";

function AppLayout({ children }) {
  const { loading } = useAuth(); // ✅ Get loading state from AuthContext
  const [showSticky, setShowSticky] = useState(false);
  const [showRFQModal, setShowRFQModal] = useState(false);

  // ✨ Gate rendering until auth is ready
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <span className='text-muted-foreground text-sm'>Loading...</span>
      </div>
    );
  }

  // Scroll listener for sticky
  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <>
      {/* Header or StickySearchBar */}
      <AnimatePresence mode='wait'>
        {!showSticky ? (
          <motion.div
            key='header'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='z-[9999]'
          >
            <Header setShowRFQModal={setShowRFQModal} />
          </motion.div>
        ) : (
          <motion.div
            key='sticky'
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='sticky top-0 z-[9999]'
          >
            <StickySearchBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div>{children}</div>

      {/* Footer */}
      <Footer />

      {/* RFQ Modal */}
      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />

      {/* Toaster */}
      <Toaster richColors position='top-center' />
    </>
  );
}

// RootProvider wraps all app contexts
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
