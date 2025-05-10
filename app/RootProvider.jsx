// app/RootProvider.jsx
"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "@/store/store";
import "../i18n";

import { watchAuthState } from "@/store/authSlice";
import { LoadingProvider } from "@/context/LoadingContext";
import { LocalizationProvider } from "@/context/LocalizationContext";

import GlobalLoading from "@/components/global/GlobalLoading";
// load heavy UI only on client
const Header = dynamic(() => import("@/components/header/Header"), {
  ssr: false,
});
const StickySearchBar = dynamic(
  () => import("@/components/header/StickySearchBar"),
  { ssr: false }
);
const Footer = dynamic(() => import("@/components/global/Footer"), {
  ssr: false,
});
import RfqModal from "@/components/rfq/Rfq";
import { Toaster } from "@/components/ui/sonner";

import Lenis from "@studio-freight/lenis";
import { AnimatePresence, motion } from "framer-motion";

// 1️⃣ Start auth listener
function AuthWatcher({ children }) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(watchAuthState());
  }, [dispatch]);
  return children;
}

// 2️⃣ Layout reads loading from Redux
function AppLayout({ children }) {
  const loading = useSelector((state) => state.auth.loading);
  const [showSticky, setShowSticky] = React.useState(false);
  const [showRFQModal, setShowRFQModal] = React.useState(false);

  // --- ALWAYS run your hooks, before any return
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // --- only now bail out if still loading
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <span className='text-muted-foreground text-sm'>Loading...</span>
      </div>
    );
  }

  // --- normal UI once ready
  return (
    <>
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

      <div>{children}</div>

      <Footer />

      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />

      <Toaster richColors position='top-center' containerStyle={{ top: 150 }} />
    </>
  );
}

// 3️⃣ Wrap entire app
export default function RootProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthWatcher>
        <LoadingProvider>
          <LocalizationProvider>
            <GlobalLoading />
            <AppLayout>{children}</AppLayout>
          </LocalizationProvider>
        </LoadingProvider>
      </AuthWatcher>
    </Provider>
  );
}
