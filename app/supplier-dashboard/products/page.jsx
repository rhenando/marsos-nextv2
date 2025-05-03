"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Plus, Trash2, Pencil } from "lucide-react";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";
  const { userData, role, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      const supplierId = userData?.uid || userData?.supplierId;
      if (!supplierId || role !== "supplier") return;

      const q = query(
        collection(db, "products"),
        where("supplierId", "==", supplierId)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(list);
      const cats = [
        "All",
        ...new Set(list.map((p) => p.category || "Uncategorized")),
      ];
      setCategories(cats);
    };
    if (!loading && userData && role === "supplier") fetchProducts();
  }, [loading, userData, role]);

  const handleDelete = async (id) => {
    if (!confirm(t("products.confirmDelete"))) return;
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
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

  if (loading || !userData) return <p>{t("products.loading")}</p>;
  if (role !== "supplier") return <p>{t("products.notAuthorized")}</p>;

  return (
    <div className='p-4'>
      <div className='mb-4'>
        <h2 className='text-2xl font-bold text-green-700'>
          {t("products.title")}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {t("products.subtitle")}
        </p>
      </div>

      <div className='flex gap-2 mb-4 overflow-x-auto'>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedTab === cat ? "default" : "outline"}
            onClick={() => {
              setSelectedTab(cat);
              setCurrentPage(1);
            }}
            className='shrink-0'
          >
            {cat}
            <Badge className='ml-2 bg-muted text-foreground'>
              {cat === "All"
                ? products.length
                : products.filter((p) => p.category === cat).length}
            </Badge>
          </Button>
        ))}
      </div>

      <div className='flex flex-wrap items-center gap-2 mb-4'>
        <Select onValueChange={(value) => console.log(value)}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder={t("products.location")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='manual'>{t("products.location")}</SelectItem>
            <SelectItem value='price'>{t("products.price")}</SelectItem>
            <SelectItem value='quantity'>{t("products.quantity")}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder={t("products.searchPlaceholder")}
          className='max-w-sm'
        />
        <Button variant='secondary'>{t("products.filter")}</Button>
        <Button>{t("products.search")}</Button>
      </div>

      <div className='flex justify-between mb-2'>
        <Button variant='outline'>{t("products.export")}</Button>
        <div className='flex gap-2'>
          <Button variant='outline'>{t("products.options")}</Button>
          <Button
            onClick={() => router.push(`/supplier-dashboard/add-products`)}
          >
            <Plus className='w-4 h-4 mr-2' />
            {t("products.addNew")}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>{t("products.product")}</TableHead>
            <TableHead>{t("products.name")}</TableHead>
            <TableHead>{t("products.supplierName")}</TableHead>
            <TableHead>{t("products.location")}</TableHead>
            <TableHead>{t("products.qtyPricing")}</TableHead>
            <TableHead>{t("products.size")}</TableHead>
            <TableHead>{t("products.color")}</TableHead>
            <TableHead>{t("products.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <input type='checkbox' />
              </TableCell>
              <TableCell>
                <img
                  src={p.mainImageUrl || "https://via.placeholder.com/50"}
                  alt=''
                  className='w-10 h-10 rounded'
                />
              </TableCell>
              <TableCell>
                {typeof p.productName === "object"
                  ? p.productName[lang] || p.productName.en
                  : p.productName}
              </TableCell>
              <TableCell>{p.supplierName || "N/A"}</TableCell>
              <TableCell>{p.mainLocation || "N/A"}</TableCell>
              <TableCell>
                {p.priceRanges?.length ? (
                  <ul className='list-disc pl-4'>
                    {p.priceRanges.map((r, i) => (
                      <li key={i}>
                        {t("products.min")}: {r.minQty}, {t("products.max")}:{" "}
                        {r.maxQty}, {t("products.price")}: SAR {r.price}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                {p.sizes?.length ? (
                  <ul className='pl-4 list-disc'>
                    {p.sizes.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                {p.colors?.length ? (
                  <ul className='pl-4 list-disc'>
                    {p.colors.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell className='flex gap-2'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() =>
                    router.push(
                      `/supplier-dashboard/products/${p.id}/edit-products`
                    )
                  }
                >
                  <Pencil className='w-4 h-4 text-blue-600' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className='w-4 h-4 text-red-600' />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className='flex justify-between items-center mt-4'>
        <Button
          variant='outline'
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          {t("products.previous")}
        </Button>
        <span className='text-sm text-muted-foreground'>
          {t("products.page")} {currentPage} {t("products.of")} {totalPages}
        </span>
        <Button
          variant='outline'
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          {t("products.next")}
        </Button>
      </div>
    </div>
  );
}
