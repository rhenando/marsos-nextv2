"use client";

import CategoryGrid from "@/components/home/CategoryGrid";
import Footer from "@/components/home/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrendingProductsSection from "@/components/home/TrendingProductsSection";

export default function Home() {
  return (
    <main className='flex flex-col'>
      <HeroSection />
      <TrendingProductsSection />
      <CategoryGrid />
      <Footer />
    </main>
  );
}
