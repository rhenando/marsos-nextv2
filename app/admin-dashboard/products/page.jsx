"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download, Trash2, Pencil } from "lucide-react";

import { db } from "@/firebase/config";

const showSuccess = (msg) => toast.success(msg);
const showError = (msg) => toast.error(msg);

export default function Products() {
  const router = useRouter();
  const { i18n, t } = useTranslation();

  // 🎯 Redux auth state
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const role = user?.role;
  const hasRole = (r) => role === r;

  const [productData, setProductData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [filterType, setFilterType] = useState("manual");
  const [searchTerm, setSearchTerm] = useState("");

  // 1️⃣ Redirect non-admins once auth is known
  useEffect(() => {
    if (!authLoading && !hasRole("admin")) {
      router.replace("/admin-login");
    }
  }, [authLoading, role, router]);

  // 2️⃣ Load products for admins
  useEffect(() => {
    if (authLoading || !hasRole("admin")) return;

    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProductData(prods);

        const cats = [
          "All",
          ...new Set(prods.map((p) => p.category || "Uncategorized")),
        ];
        setCategories(cats);
      } catch (err) {
        console.error(err);
        showError(t("admin_products.failed_to_load"));
      }
    };

    fetchProducts();
  }, [authLoading, role, t]);

  // 3️⃣ Delete handler
  const handleDelete = async (id) => {
    if (!confirm(t("admin_products.confirm_delete"))) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProductData((prev) => prev.filter((p) => p.id !== id));
      showSuccess(t("admin_products.deleted_success"));
    } catch (err) {
      console.error(err);
      showError(t("admin_products.delete_failed"));
    }
  };

  // 4️⃣ Search & sort
  const handleSearch = () => {
    let filtered = [...productData];
    if (searchTerm) {
      filtered = filtered.filter((p) => {
        const name =
          typeof p.productName === "object"
            ? p.productName[i18n.language] || p.productName.en
            : p.productName;
        return `${name} ${p.sku} ${p.supplierName}`
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
      const snap = await getDocs(collection(db, "products"));
      setProductData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      showError(t("admin_products.reset_failed"));
    }
  };

  // 5️⃣ Tabs & Pagination
  const filteredProducts =
    selectedTab === "All"
      ? productData
      : productData.filter(
          (p) =>
            (p.category || "Uncategorized").toLowerCase() ===
            selectedTab.toLowerCase()
        );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 6️⃣ Excel export
  const handleExportToExcel = () => {
    if (!productData.length) {
      showError(t("admin_products.no_data"));
      return;
    }
    const rows = productData.map((p) => ({
      ID: p.id,
      "Product Name":
        typeof p.productName === "object"
          ? p.productName[i18n.language] || p.productName.en
          : p.productName,
      "Supplier Name": p.supplierName,
      Location: p.mainLocation,
      Price: p.price,
      Quantity: p.quantity,
      Category: p.category,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products_export.xlsx");
    showSuccess(t("admin_products.export_success"));
  };

  // 🔒 still loading auth or not admin? show nothing
  if (authLoading || !hasRole("admin")) {
    return <p className='text-center py-6'>{t("admin_products.loading")}</p>;
  }

  return (
    <div className='p-4 max-w-screen-xl mx-auto'>
      <h2 className='text-xl font-bold text-green-600 mb-2'>
        {t("admin_products.title")}
      </h2>
      <p className='text-gray-600 text-sm mb-4'>
        {t("admin_products.subtitle")}
      </p>

      {/* Filters */}
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
          placeholder={t("admin_products.search_placeholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='border px-2 py-1 rounded w-full sm:w-64'
        />

        <button
          onClick={handleSearch}
          className='bg-blue-600 text-white px-3 py-1 rounded'
        >
          {t("admin_products.search_button")}
        </button>
        <button
          onClick={resetSearch}
          className='bg-gray-500 text-white px-3 py-1 rounded'
        >
          {t("admin_products.reset_button")}
        </button>
      </div>

      {/* Export & Add */}
      <div className='flex justify-between items-center mb-4 text-sm'>
        <button
          onClick={handleExportToExcel}
          className='flex items-center gap-2 border border-blue-600 text-blue-600 px-3 py-1 rounded'
        >
          <Download size={16} />
          {t("admin_products.export_to_excel")}
        </button>
        <button
          onClick={() => router.push("/admin-dashboard/products/add")}
          className='bg-green-600 text-white px-3 py-1 rounded'
        >
          {t("admin_products.add_new")}
        </button>
      </div>

      {/* Categories Tabs */}
      <div className='flex flex-wrap gap-2 mb-4'>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedTab(cat);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded text-sm border ${
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

      {/* Table */}
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm text-left'>
          <thead className='bg-gray-100 text-gray-600'>
            <tr>
              <th className='p-2'>#</th>
              <th className='p-2'>{t("admin_products.column_name")}</th>
              <th className='p-2'>{t("admin_products.column_supplier")}</th>
              <th className='p-2'>{t("admin_products.column_location")}</th>
              <th className='p-2'>{t("admin_products.column_qty_price")}</th>
              <th className='p-2'>{t("admin_products.column_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p, idx) => (
              <tr key={p.id} className='border-b hover:bg-gray-50'>
                <td className='p-2'>
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>
                <td className='p-2'>
                  {typeof p.productName === "object"
                    ? p.productName[i18n.language] || p.productName.en
                    : p.productName}
                </td>
                <td className='p-2'>{p.supplierName}</td>
                <td className='p-2'>{p.mainLocation}</td>
                <td className='p-2'>
                  {p.priceRanges?.map((r, i) => (
                    <div key={i}>
                      {r.minQty}–{r.maxQty} @ {r.price} SAR
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
                    <Pencil size={14} /> {t("admin_products.edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className='text-red-600 hover:underline flex items-center gap-1'
                  >
                    <Trash2 size={14} /> {t("admin_products.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className='flex justify-between mt-4 text-sm'>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className='px-3 py-1 border rounded disabled:opacity-50'
        >
          {t("admin_products.prev")}
        </button>
        <span>
          {t("admin_products.page")} {currentPage} {t("admin_products.of")}{" "}
          {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className='px-3 py-1 border rounded disabled:opacity-50'
        >
          {t("admin_products.next")}
        </button>
      </div>
    </div>
  );
}
