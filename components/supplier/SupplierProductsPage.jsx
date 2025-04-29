import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import ProductCard from "../ProductCard";

const Products = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  const { supplierId, supplierName } = useParams();

  const [productData, setProductData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [supplierData, setSupplierData] = useState(null);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchSupplierProducts = async () => {
      try {
        if (!supplierId) return;
        const productsRef = collection(db, "products");
        const supplierProductsQuery = query(
          productsRef,
          where("supplierId", "==", supplierId)
        );
        const querySnapshot = await getDocs(supplierProductsQuery);

        const products = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProductData(products);

        const uniqueCategories = [
          "All",
          ...new Set(
            products.map((product) => product.category || "Uncategorized")
          ),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching supplier products:", error);
      }
    };

    fetchSupplierProducts();
  }, [supplierId]);

  useEffect(() => {
    const fetchSupplierInfo = async () => {
      try {
        if (!supplierId) return;
        const suppliersRef = collection(db, "suppliers");
        const supplierQuery = query(
          suppliersRef,
          where("id", "==", supplierId)
        );
        const supplierSnapshot = await getDocs(supplierQuery);

        if (!supplierSnapshot.empty) {
          const supplierInfo = supplierSnapshot.docs[0].data();
          setSupplierData(supplierInfo);
        }
      } catch (error) {
        console.error("Error fetching supplier info:", error);
      }
    };

    fetchSupplierInfo();
  }, [supplierId]);

  const filteredProducts = productData.filter((product) => {
    const matchesCategory =
      selectedTab === "All" || product.category === selectedTab;
    const matchesSearch =
      searchQuery.trim() === "" ||
      (typeof product.productName === "object"
        ? product.productName[currentLang]
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        : product.productName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()));

    const matchesPrice =
      (!minPrice || product.price >= parseFloat(minPrice)) &&
      (!maxPrice || product.price <= parseFloat(maxPrice));

    return matchesCategory && matchesSearch && matchesPrice;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className='w-full px-4 md:px-8 py-6'>
      {/* Page Header */}
      <div className='mb-6 text-center sm:text-left'>
        <h2 className='text-2xl font-bold' style={{ color: "#2c6449" }}>
          {supplierData?.name ||
            supplierName ||
            t("supplier-products.moreFromSupplier")}
        </h2>
        <p className='text-gray-500 text-sm'>
          {t("supplier-products.subtitle")}
        </p>
      </div>

      {/* Supplier Banner */}
      <div className='flex items-center gap-4 bg-white p-4 rounded shadow-sm mb-8'>
        <div className='flex-shrink-0'>
          <img
            src={
              supplierData?.logoUrl ||
              "https://via.placeholder.com/60x60.png?text=Logo"
            }
            alt={supplierData?.name || "Supplier Logo"}
            className='w-16 h-16 rounded-full object-cover'
          />
        </div>

        <div>
          <h3 className='text-xl font-bold' style={{ color: "#2c6449" }}>
            {supplierData?.name || supplierName || "Supplier Name"}
          </h3>
          <p className='text-gray-500 text-sm'>Verified Supplier</p>
        </div>
      </div>

      {/* Layout Grid: Sidebar + Products */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
        {/* Sidebar */}
        <div className='hidden lg:block'>
          <div className='bg-white p-4 rounded shadow-sm sticky top-24'>
            {/* Filters Title */}
            <h2 className='text-xl font-bold text-gray-800 mb-6'>
              {t("supplier-products.filters")}
            </h2>

            {/* Categories Section */}
            <div>
              <h3
                className='text-lg font-semibold mb-4'
                style={{ color: "#2c6449" }}
              >
                {t("supplier-products.categories")}
              </h3>
              <div className='flex flex-col gap-2'>
                {categories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedTab(category);
                      setCurrentPage(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`text-left px-3 py-2 rounded text-sm transition ${
                      selectedTab === category
                        ? "bg-[#2c6449] text-white font-semibold"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {category}
                    <span className='ml-2 inline-block text-xs text-gray-500'>
                      (
                      {category === "All"
                        ? productData.length
                        : productData.filter(
                            (product) => product.category === category
                          ).length}
                      )
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Section */}
            <div className='mt-8'>
              <h3
                className='text-lg font-semibold mb-4'
                style={{ color: "#2c6449" }}
              >
                {t("supplier-products.priceRange")}
              </h3>
              <div className='flex flex-col gap-2'>
                <input
                  type='number'
                  placeholder='Min Price'
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className='border border-gray-300 rounded px-3 py-2 text-sm'
                />
                <input
                  type='number'
                  placeholder='Max Price'
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className='border border-gray-300 rounded px-3 py-2 text-sm'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className='col-span-1 lg:col-span-3'>
          {/* Search Section */}
          <div className='flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-8'>
            <input
              type='text'
              className='border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-xs mx-auto sm:mx-0'
              placeholder={t("supplier-products.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Product Cards Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={currentLang}
                  currencySymbol='SAR'
                />
              ))
            ) : (
              <div className='col-span-full text-center text-gray-400 text-sm py-10'>
                {t("supplier-products.noProductsFound")}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className='flex flex-col sm:flex-row justify-between items-center mt-8 gap-4'>
            <button
              className='border text-sm rounded px-6 py-2 hover:bg-gray-100 w-full sm:w-auto text-center'
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              {t("supplier-products.previous")}
            </button>
            <span className='text-sm text-gray-600'>
              {t("supplier-products.page")} {currentPage}{" "}
              {t("supplier-products.of")} {totalPages}
            </span>
            <button
              className='border text-sm rounded px-6 py-2 hover:bg-gray-100 w-full sm:w-auto text-center'
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              {t("supplier-products.next")}
            </button>
          </div>
        </div>
      </div>

      {/* Back to Top Button for Mobile Only */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className='fixed bottom-6 right-6 text-white p-3 rounded-full shadow-lg sm:hidden transition'
        style={{ backgroundColor: "#2c6449" }}
      >
        ↑
      </button>
    </div>
  );
};

export default Products;
