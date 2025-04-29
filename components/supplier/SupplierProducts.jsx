"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toastUtils";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  const { loading, role, userData } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supplierId = userData?.uid || userData?.supplierId;
        if (!supplierId || role !== "supplier") return;

        const q = query(
          collection(db, "products"),
          where("supplierId", "==", supplierId)
        );
        const snapshot = await getDocs(q);

        const fetchedProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(fetchedProducts);

        const uniqueCategories = [
          "All",
          ...new Set(fetchedProducts.map((p) => p.category || "Uncategorized")),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("❌ Failed to fetch products:", err);
      }
    };

    if (!loading && role === "supplier" && userData) {
      fetchProducts();
    }
  }, [loading, role, userData]);

  const handleDelete = async (productId) => {
    const confirmDelete = confirm(t("products.confirmDelete"));
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showSuccess(t("products.deleteSuccess"));
    } catch (err) {
      console.error("❌ Delete failed:", err);
      showError(t("products.deleteFail"));
    }
  };

  const filtered =
    selectedTab === "All"
      ? products
      : products.filter((p) => p.category === selectedTab);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading || !userData) {
    return (
      <div className='p-4 text-sm text-gray-500'>{t("products.loading")}</div>
    );
  }

  if (role !== "supplier") {
    return (
      <div className='p-4 text-sm text-red-500'>
        {t("products.notAuthorized")}
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto p-6'>
      <div className='mb-4'>
        <h2 className='text-2xl font-semibold text-[#2c6449]'>
          {t("products.title")}
        </h2>
        <p className='text-sm text-gray-500'>{t("products.subtitle")}</p>
      </div>

      {/* Category Tabs */}
      <div className='flex flex-wrap gap-3 mb-6'>
        {categories.map((cat) => (
          <Button
            key={cat}
            size='sm'
            variant={selectedTab === cat ? "default" : "outline"}
            onClick={() => {
              setSelectedTab(cat);
              setCurrentPage(1);
            }}
          >
            {cat}{" "}
            <span className='ml-1 text-xs bg-white text-gray-700 px-1 rounded'>
              {cat === "All"
                ? products.length
                : products.filter((p) => p.category === cat).length}
            </span>
          </Button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className='flex justify-between items-center mb-4'>
        <Button variant='outline'>{t("products.export")}</Button>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => router.push("/supplier-add-products")}
          >
            {t("products.addNew")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto border rounded-lg'>
        <table className='min-w-full text-sm'>
          <thead className='bg-[#2c6449] text-white'>
            <tr>
              <th className='px-4 py-2'>#</th>
              <th className='px-4 py-2'>{t("products.name")}</th>
              <th className='px-4 py-2'>{t("products.location")}</th>
              <th className='px-4 py-2'>{t("products.qtyPricing")}</th>
              <th className='px-4 py-2'>{t("products.size")}</th>
              <th className='px-4 py-2'>{t("products.color")}</th>
              <th className='px-4 py-2'>{t("products.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product, i) => (
              <tr key={product.id} className='hover:bg-gray-50'>
                <td className='px-4 py-2'>
                  {(currentPage - 1) * itemsPerPage + i + 1}
                </td>
                <td className='px-4 py-2 font-medium'>
                  {typeof product.productName === "object"
                    ? product.productName[currentLang] || product.productName.en
                    : product.productName}
                </td>
                <td className='px-4 py-2'>{product.mainLocation || "N/A"}</td>
                <td className='px-4 py-2'>
                  {product.priceRanges?.length ? (
                    <ul>
                      {product.priceRanges.map((range, idx) => (
                        <li key={idx}>
                          {range.minQty}-{range.maxQty}: SAR {range.price}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className='px-4 py-2'>
                  {product.sizes?.length ? (
                    <ul>
                      {product.sizes.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className='px-4 py-2'>
                  {product.colors?.length ? (
                    <ul>
                      {product.colors.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className='px-4 py-2 flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      router.push(`/supplier-edit-products/${product.id}`)
                    }
                  >
                    {t("products.edit")}
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => handleDelete(product.id)}
                  >
                    {t("products.remove")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between mt-4'>
          <Button
            size='sm'
            variant='outline'
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            {t("products.previous")}
          </Button>
          <span className='text-sm text-gray-600'>
            {t("products.page")} {currentPage} {t("products.of")} {totalPages}
          </span>
          <Button
            size='sm'
            variant='outline'
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("products.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
