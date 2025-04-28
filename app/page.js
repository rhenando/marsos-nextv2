"use client";

import HeroSection from "@/components/home/HeroSection";
import TrendingProductsSection from "@/components/home/TrendingProductsSection";

export default function Home() {
  return (
    <main className='flex flex-col'>
      <HeroSection />
      <TrendingProductsSection />
    </main>
  );
}
