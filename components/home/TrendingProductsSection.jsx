"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion"; // 🌟 New import
import ProductCard from "../global/ProductCard";

const TrendingProductsSection = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("trending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-SA" : "en-US";
  const currencySymbol = "SR";

  const formatNumber = useCallback(
    (number) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(number),
    [locale]
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllProducts(fetched);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(t("errors.failedToLoadProducts"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const getTrendingProducts = useCallback(() => {
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }, [allProducts]);

  return (
    <section className='bg-gray-50 py-10'>
      <div className='w-[90%] mx-auto'>
        {/* Tabs */}
        <div className='flex flex-wrap gap-3 mb-8'>
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-5 py-2 text-sm rounded-full font-semibold transition ${
              activeTab === "trending"
                ? "bg-[#2c6449] text-white"
                : "bg-white border border-gray-300 text-[#2c6449]"
            }`}
          >
            {t("section.trending")}
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2 text-sm rounded-full font-semibold transition ${
              activeTab === "all"
                ? "bg-[#2c6449] text-white"
                : "bg-white border border-gray-300 text-[#2c6449]"
            }`}
          >
            {t("section.allProducts")}
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className='text-center text-gray-500'>{t("loading")}</div>
        ) : error ? (
          <div className='text-center text-red-600'>{error}</div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {(activeTab === "trending"
              ? getTrendingProducts()
              : allProducts
            ).map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <ProductCard
                  product={product}
                  locale={locale}
                  currencySymbol={currencySymbol}
                  formatNumber={formatNumber}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingProductsSection;
