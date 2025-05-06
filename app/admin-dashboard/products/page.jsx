"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Download, Trash2, Pencil } from "lucide-react";

const showSuccess = (msg) => toast.success(msg);
const showError = (msg) => toast.error(msg);

const Products = () => {
  const { hasRole, loading, role } = useAuth();
  const [productData, setProductData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const [filterType, setFilterType] = useState("manual");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && hasRole("admin")) {
      const fetchProducts = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "products"));
          const products = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProductData(products);
          const uniqueCategories = [
            "All",
            ...new Set(products.map((p) => p.category || "Uncategorized")),
          ];
          setCategories(uniqueCategories);
        } catch (error) {
          console.error("Error fetching products: ", error);
          showError("Failed to load products.");
        }
      };
      fetchProducts();
    }
  }, [loading, hasRole]);

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", productId));
        setProductData((prev) => prev.filter((p) => p.id !== productId));
        showSuccess("Deleted successfully!");
      } catch (err) {
        console.error(err);
        showError("Failed to delete product.");
      }
    }
  };

  const handleSearch = () => {
    let filtered = [...productData];
    if (searchTerm.trim()) {
      filtered = filtered.filter((p) => {
        const productName =
          typeof p.productName === "object"
            ? p.productName[i18n.language] || p.productName.en
            : p.productName;

        return [productName, p.sku, p.supplierName]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    }

    if (filterType === "manual") {
      filtered = filtered.filter((p) => p.mainLocation);
    } else if (filterType === "price") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filterType === "quantity") {
      filtered.sort((a, b) => a.quantity - b.quantity);
    }

    setProductData(filtered);
  };

  const resetSearch = async () => {
    setSearchTerm("");
    setFilterType("manual");
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductData(products);
    } catch (error) {
      showError("Failed to reset products.");
    }
  };

  const filteredProducts =
    selectedTab === "All"
      ? productData
      : productData.filter(
          (p) =>
            p.category?.trim().toLowerCase() ===
            selectedTab.trim().toLowerCase()
        );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportToExcel = () => {
    if (productData.length === 0) {
      showError("No data to export");
      return;
    }

    const excelData = productData.map((p) => ({
      ID: p.id,
      "Product Name":
        typeof p.productName === "object"
          ? p.productName[i18n.language] || p.productName.en || "N/A"
          : p.productName || "N/A",
      "Supplier Name": p.supplierName || "N/A",
      Location: p.mainLocation || "N/A",
      Price: p.price || "N/A",
      Quantity: p.quantity || "N/A",
      Category: p.category || "N/A",
    }));

    const sheet = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Products");
    XLSX.writeFile(wb, "products_export.xlsx");
    showSuccess("Products exported successfully!");
  };

  if (!loading && role !== "admin") return <div>You are not authorized.</div>;

  return (
    <div className='p-4 max-w-screen-xl mx-auto'>
      <div className='mb-4'>
        <h2 className='text-xl font-bold text-green-600'>
          {t("admin_products.products")}
        </h2>
        <p className='text-gray-600 text-sm'>
          {t("admin_products.all_products")}
        </p>
      </div>

      <div className='flex flex-wrap gap-2 mb-4 text-sm'>
        <select
          className='border rounded px-2 py-1'
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            handleSearch();
          }}
        >
          <option value='manual'>{t("admin_products.location")}</option>
          <option value='price'>{t("admin_products.price")}</option>
          <option value='quantity'>{t("admin_products.quantity")}</option>
        </select>

        <input
          type='text'
          placeholder={t("admin_products.search_by")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='border px-2 py-1 rounded w-full sm:w-64'
        />

        <button
          onClick={handleSearch}
          className='bg-blue-600 text-white px-3 py-1 rounded'
        >
          {t("admin_products.search")}
        </button>
        <button
          onClick={resetSearch}
          className='bg-gray-500 text-white px-3 py-1 rounded'
        >
          {t("admin_products.reset")}
        </button>
      </div>

      <div className='flex justify-between items-center mb-4 text-sm'>
        <button
          onClick={handleExportToExcel}
          className='flex items-center gap-2 border border-blue-600 text-blue-600 px-3 py-1 rounded'
        >
          <Download size={16} />
          {t("admin_products.export_to")}
        </button>
        <button
          onClick={() => router.push("/admin-dashboard/products/add")}
          className='bg-green-600 text-white px-3 py-1 rounded'
        >
          {t("admin_products.add_new")}
        </button>
      </div>

      <div className='flex flex-wrap gap-2 mb-4'>
        {categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => setSelectedTab(cat)}
            className={`px-3 py-1 rounded text-sm border transition-all duration-200 ${
              selectedTab === cat
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {cat} (
            {cat === "All"
              ? productData.length
              : productData.filter((p) => p.category === cat).length}
            )
          </button>
        ))}
      </div>

      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm text-left'>
          <thead className='bg-gray-100 text-gray-600'>
            <tr>
              <th className='p-2'>#</th>
              <th className='p-2'>{t("admin_products.product_name")}</th>
              <th className='p-2'>{t("admin_products.supplier_name")}</th>
              <th className='p-2'>{t("admin_products.location")}</th>
              <th className='p-2'>{t("admin_products.quantity_pricing")}</th>
              <th className='p-2'>{t("admin_products.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p, i) => (
              <tr key={p.id} className='border-b hover:bg-gray-50'>
                <td className='p-2'>{i + 1}</td>
                <td className='p-2'>
                  {typeof p.productName === "object"
                    ? p.productName[i18n.language] || p.productName.en || "N/A"
                    : p.productName || "N/A"}
                </td>
                <td className='p-2'>{p.supplierName}</td>
                <td className='p-2'>{p.mainLocation}</td>
                <td className='p-2'>
                  {p.priceRanges?.map((range, idx) => (
                    <div key={idx}>
                      {range.minQty} - {range.maxQty} @ {range.price} SAR
                    </div>
                  )) || "N/A"}
                </td>
                <td className='p-2 flex gap-2'>
                  <button
                    onClick={() =>
                      router.push(`/admin-dashboard/products/edit/${p.id}`)
                    }
                    className='text-blue-600 hover:underline flex items-center gap-1'
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className='text-red-600 hover:underline flex items-center gap-1'
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex justify-between mt-4 text-sm'>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className='px-3 py-1 border rounded disabled:opacity-50'
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className='px-3 py-1 border rounded disabled:opacity-50'
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Products;
