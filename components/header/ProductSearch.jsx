"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Input } from "../ui/input";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "../ui/command";
import { Search } from "react-feather";

import { db } from "../../firebase/config";
import { getDocs, collection } from "firebase/firestore";

const ProductSearch = () => {
  const [productQuery, setProductQuery] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const { t } = useTranslation(); // 🌟
  const router = useRouter();

  const normalize = (str) => {
    if (typeof str !== "string") return "";
    return str.toLowerCase().normalize("NFKD");
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        const name =
          data.productName ||
          data.productName_en ||
          data.productName_ar ||
          "Unnamed Product";
        const thumbnail = data.mainImageUrl || "/placeholder-product.png";

        return {
          id: doc.id,
          name: typeof name === "string" ? name : String(name),
          thumbnail,
        };
      });

      setProductOptions(items);
      setFilteredProducts(items);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (productQuery === "") {
      setFilteredProducts(productOptions);
    } else {
      setFilteredProducts(
        productOptions.filter((item) =>
          normalize(item.name).includes(normalize(productQuery))
        )
      );
    }
  }, [productQuery, productOptions]);

  const handleSelect = (selectedValue) => {
    const selectedProduct = productOptions.find(
      (item) => item.name.toLowerCase() === selectedValue.toLowerCase()
    );
    if (selectedProduct?.id) {
      router.push(`/product/${selectedProduct.id}`);
    }
  };

  return (
    <div className='relative w-full'>
      {/* Search Input */}
      <div className='relative'>
        <Input
          type='search'
          placeholder={t("search.searchPlaceholder")} // 🌟
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
          className='pl-10 rounded-full border-[#2c6449] text-[#2c6449] placeholder-[#2c6449]'
        />
        <div className='absolute inset-y-0 left-3 flex items-center pointer-events-none'>
          <Search size={16} className='text-[#2c6449]' />
        </div>
      </div>

      {/* Dropdown Results */}
      {productQuery && (
        <div className='absolute left-0 right-0 top-full mt-2 z-50'>
          <Command className='w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden'>
            <CommandInput
              value={productQuery}
              onValueChange={setProductQuery}
              placeholder={t("search.searchPlaceholder")} // 🌟
              className='hidden'
            />
            <CommandList className='max-h-[400px] overflow-y-auto'>
              {filteredProducts.length > 0 ? (
                <CommandGroup heading={t("search.productsHeading")}>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={handleSelect}
                      className='flex items-center gap-4 px-4 py-3 min-h-[64px] cursor-pointer hover:bg-[#2c6449]/10 transition'
                    >
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className='w-12 h-12 rounded object-cover flex-shrink-0'
                      />
                      <span className='text-base text-gray-700 truncate'>
                        {product.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <div className='flex flex-col items-center justify-center p-6 gap-2 text-center'>
                  <img
                    src='/no-results-search.svg'
                    alt='No results'
                    className='w-24 h-24 object-contain'
                  />
                  <p className='text-gray-500 text-sm'>
                    {t("search.noResults")}
                  </p>
                </div>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
