"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function EditProductPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setProduct(snapshot.data());
      } else {
        toast.error("Product not found.");
        router.push("/supplier-dashboard/products");
      }
      setLoading(false);
    };

    if (id) fetchProduct();
  }, [id]);

  const handleInputChange = (key, value) => {
    setProduct((prev) => ({ ...prev, [key]: value }));
  };

  const handleLocalizedChange = (field, langKey, value) => {
    setProduct((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [langKey]: value,
      },
    }));
  };

  const handleUpdate = async () => {
    if (!product.productName?.en || !product.slug || !product.mainImageUrl) {
      toast.error(
        "Please fill in required fields like name, slug, and main image."
      );
      return;
    }

    try {
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, {
        ...product,
        updatedAt: serverTimestamp(),
      });
      toast.success("Product updated!");
      router.push("/supplier-dashboard/products");
    } catch (err) {
      toast.error("Failed to update product.");
      console.error(err);
    }
  };

  const handlePriceRangeChange = (index, key, value) => {
    setProduct((prev) => {
      const updated = [...prev.priceRanges];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, priceRanges: updated };
    });
  };

  const handleLocationChange = (rangeIdx, locIdx, key, value) => {
    setProduct((prev) => {
      const updatedRanges = [...prev.priceRanges];
      const locations = [...(updatedRanges[rangeIdx].locations || [])];
      locations[locIdx] = { ...locations[locIdx], [key]: value };
      updatedRanges[rangeIdx].locations = locations;
      return { ...prev, priceRanges: updatedRanges };
    });
  };

  const addLocationToRange = (rangeIdx) => {
    setProduct((prev) => {
      const updatedRanges = [...prev.priceRanges];
      const locations = updatedRanges[rangeIdx].locations || [];
      updatedRanges[rangeIdx].locations = [
        ...locations,
        { location: "", locationPrice: "" },
      ];
      return { ...prev, priceRanges: updatedRanges };
    });
  };

  const removePriceRange = (index) => {
    setProduct((prev) => {
      const updated = [...prev.priceRanges];
      updated.splice(index, 1);
      return { ...prev, priceRanges: updated };
    });
  };

  const addNewPriceRange = () => {
    setProduct((prev) => ({
      ...prev,
      priceRanges: [
        ...(prev.priceRanges || []),
        {
          minQty: "",
          maxQty: "",
          price: "",
          locations: [],
        },
      ],
    }));
  };

  const addAdditionalImage = (url) => {
    setProduct((prev) => ({
      ...prev,
      additionalImageUrls: [...(prev.additionalImageUrls || []), url],
    }));
  };

  const removeAdditionalImage = (idx) => {
    setProduct((prev) => {
      const updated = [...(prev.additionalImageUrls || [])];
      updated.splice(idx, 1);
      return { ...prev, additionalImageUrls: updated };
    });
  };

  const addItemToArray = (field, value) => {
    setProduct((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value],
    }));
  };

  const removeItemFromArray = (field, index) => {
    setProduct((prev) => {
      const updated = [...(prev[field] || [])];
      updated.splice(index, 1);
      return { ...prev, [field]: updated };
    });
  };

  const categoryOptions = [
    "Clothing",
    "Electronics",
    "Food",
    "Service Subscription",
    "Other",
  ];

  const subCategoryOptions = ["Accessories", "Tools", "Appliances", "Others"];

  const [uploading, setUploading] = useState(false);

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Create a storage reference using a unique file path (using product id and current time for example)
      const filePath = `products/${id}_main_${Date.now()}`;
      const storageRef = ref(storage, filePath);

      // Upload file
      const uploadResult = await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Update the product state with the new URL
      handleInputChange("mainImageUrl", downloadURL);
      toast.success("Main image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image: ", error);
      toast.error("Error uploading image.");
    }
  };

  const handleAdditionalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const filePath = `products/${id}_additional_${Date.now()}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      addAdditionalImage(downloadURL);
      toast.success("Additional image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading additional image: ", error);
      toast.error("Error uploading additional image.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className='p-6 space-y-6'>
      <h2 className='text-2xl font-bold text-green-700'>
        {t("products.editTitle")}
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className='text-xl'>{t("products.editTitle")}</CardTitle>
        </CardHeader>
        <CardContent className='grid md:grid-cols-2 gap-4'>
          {/* Product Name EN */}
          <div>
            <label className='block mb-1 font-medium'>Product Name (EN)</label>
            <Input
              value={product.productName?.en || ""}
              onChange={(e) =>
                handleLocalizedChange("productName", "en", e.target.value)
              }
            />
          </div>

          {/* Product Name AR */}
          <div>
            <label className='block mb-1 font-medium'>Product Name (AR)</label>
            <Input
              value={product.productName?.ar || ""}
              onChange={(e) =>
                handleLocalizedChange("productName", "ar", e.target.value)
              }
            />
          </div>

          {/* Description EN */}
          <div>
            <label className='block mb-1 font-medium'>Description (EN)</label>
            <Textarea
              value={product.description?.en || ""}
              onChange={(e) =>
                handleLocalizedChange("description", "en", e.target.value)
              }
            />
          </div>

          {/* Description AR */}
          <div>
            <label className='block mb-1 font-medium'>Description (AR)</label>
            <Textarea
              value={product.description?.ar || ""}
              onChange={(e) =>
                handleLocalizedChange("description", "ar", e.target.value)
              }
            />
          </div>

          {/* Slug */}
          <div className='md:col-span-2'>
            <label className='block mb-1 font-medium'>Slug</label>
            <Input
              value={product.slug || ""}
              onChange={(e) => handleInputChange("slug", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Price Ranges */}
      <div>
        <h3 className='text-lg font-semibold mb-2'>Price Ranges</h3>
        {product.priceRanges?.map((range, idx) => (
          <div
            key={idx}
            className='border p-4 rounded-md mb-4 bg-muted/30 space-y-2'
          >
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Input
                placeholder='Min Qty'
                value={range.minQty}
                onChange={(e) =>
                  handlePriceRangeChange(idx, "minQty", e.target.value)
                }
              />
              <Input
                placeholder='Max Qty'
                value={range.maxQty}
                onChange={(e) =>
                  handlePriceRangeChange(idx, "maxQty", e.target.value)
                }
              />
              <Input
                placeholder='Base Price'
                value={range.price}
                onChange={(e) =>
                  handlePriceRangeChange(idx, "price", e.target.value)
                }
              />
            </div>

            {/* Nested Locations */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Location-based Pricing</h4>
              {range.locations?.map((loc, locIdx) => (
                <div key={locIdx} className='grid grid-cols-2 gap-2'>
                  <Input
                    placeholder='Location Name'
                    value={loc.location}
                    onChange={(e) =>
                      handleLocationChange(
                        idx,
                        locIdx,
                        "location",
                        e.target.value
                      )
                    }
                  />
                  <Input
                    placeholder='Location Price'
                    value={loc.locationPrice}
                    onChange={(e) =>
                      handleLocationChange(
                        idx,
                        locIdx,
                        "locationPrice",
                        e.target.value
                      )
                    }
                  />
                </div>
              ))}
              <Button
                variant='ghost'
                onClick={() => addLocationToRange(idx)}
                className='text-xs'
              >
                + Add Location
              </Button>
            </div>

            <Button
              variant='destructive'
              size='sm'
              onClick={() => removePriceRange(idx)}
            >
              Remove Price Range
            </Button>
          </div>
        ))}

        <Button variant='outline' onClick={addNewPriceRange}>
          + Add Price Range
        </Button>
      </div>

      {/* Image Section */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Images</h3>

        {/* Main Image */}
        <div>
          <p className='text-sm mb-1'>Main Image</p>
          <img
            src={product.mainImageUrl}
            alt='Main'
            className='w-24 h-24 rounded object-cover mb-2'
          />
          <Input
            type='text'
            value={product.mainImageUrl || ""}
            onChange={(e) => handleInputChange("mainImageUrl", e.target.value)}
            placeholder='Paste main image URL or upload later'
          />
        </div>

        {/* Additional Images */}
        <div>
          <p className='text-sm mb-1'>Additional Images</p>
          <div className='flex gap-2 flex-wrap'>
            {product.additionalImageUrls?.map((url, idx) => (
              <div key={idx} className='relative w-24 h-24'>
                <img
                  src={url}
                  alt={`Image ${idx}`}
                  className='w-full h-full object-cover rounded'
                />
                <Button
                  variant='destructive'
                  size='icon'
                  className='absolute top-0 right-0 text-xs'
                  onClick={() => removeAdditionalImage(idx)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          <Input
            type='text'
            placeholder='Paste image URL and press enter'
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                addAdditionalImage(e.target.value.trim());
                e.target.value = "";
              }
            }}
            className='mt-2'
          />
        </div>
        {/* Main Image Upload */}
        <div className='mt-4'>
          <label className='block mb-1 font-medium'>
            Upload New Main Image
          </label>
          <input
            type='file'
            accept='image/*'
            onChange={handleMainImageUpload}
            className='mb-2'
          />
          {/* Additional Image Upload */}
          <div className='mt-4'>
            <label className='block mb-1 font-medium'>
              Upload Additional Image
            </label>
            <input
              type='file'
              accept='image/*'
              onChange={handleAdditionalImageUpload}
              className='mb-2'
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className='text-lg font-semibold mb-2'>Colors</h3>
        <div className='flex flex-wrap gap-2 mb-2'>
          {product.colors?.map((color, idx) => (
            <Badge
              key={idx}
              variant='secondary'
              className='cursor-pointer'
              onClick={() => removeItemFromArray("colors", idx)}
            >
              {color} ×
            </Badge>
          ))}
        </div>
        <Input
          placeholder='Type color and press Enter'
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              addItemToArray("colors", e.target.value.trim());
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* Sizes */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold mb-2'>Sizes</h3>
        <div className='flex flex-wrap gap-2 mb-2'>
          {product.sizes?.map((size, idx) => (
            <Badge
              key={idx}
              variant='secondary'
              className='cursor-pointer'
              onClick={() => removeItemFromArray("sizes", idx)}
            >
              {size} ×
            </Badge>
          ))}
        </div>
        <Input
          placeholder='Type size and press Enter'
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              addItemToArray("sizes", e.target.value.trim());
              e.target.value = "";
            }
          }}
        />
      </div>

      <Button onClick={handleUpdate}>{t("products.save")}</Button>
    </div>
  );
}
