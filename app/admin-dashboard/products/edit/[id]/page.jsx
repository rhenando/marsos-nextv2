"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { Loader2 } from "lucide-react";

import {
  defaultLocationOptions,
  defaultSizeOptions,
  defaultColorOptions,
  defaultQuantityOptions,
} from "@/lib/productOptions";
import useProductValidation from "@/hooks/useProductValidation";
import { generateSlug, ensureUniqueSlug } from "@/utils/slugify";
import { useSelector } from "react-redux";

export default function ProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const { validateProduct } = useProductValidation();

  // Loading & submit state
  const [loading, setLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === Form state ===
  // Basic info
  const [productNameEn, setProductNameEn] = useState("");
  const [productDescriptionEn, setProductDescriptionEn] = useState("");
  const [productNameAr, setProductNameAr] = useState("");
  const [productDescriptionAr, setProductDescriptionAr] = useState("");

  // Category & subcategory
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryMap, setSubCategoryMap] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Sizes, colors, location
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedMainLocation, setSelectedMainLocation] = useState(null);

  // Images
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([
    { id: Date.now() },
  ]);
  const [additionalImageFiles, setAdditionalImageFiles] = useState({});
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState({});

  // Price tiers
  const [priceTiers, setPriceTiers] = useState([
    {
      id: Date.now(),
      minQty: null,
      maxQty: null,
      price: null,
      deliveryLocations: [{ id: Date.now(), location: null, price: null }],
    },
  ]);

  // Helper to upload one file
  const uploadImageToStorage = async (file, path) => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // Fetch categories and—if editing—existing product
  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "products"));
      const cats = new Set();
      const subMap = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data.category) {
          cats.add(data.category);
          if (data.subCategory) {
            subMap[data.category] = subMap[data.category] || new Set();
            subMap[data.category].add(data.subCategory);
          }
        }
      });
      setCategoryOptions([...cats].map((c) => ({ label: c, value: c })));
      const final = {};
      Object.entries(subMap).forEach(([cat, set]) => {
        final[cat] = [...set].map((s) => ({ label: s, value: s }));
      });
      setSubCategoryMap(final);
    };

    const fetchProduct = async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (!snap.exists()) {
          toast.error("Product not found.");
          return router.push("/admin-dashboard/products");
        }
        const d = snap.data();

        // hydrate all fields
        setProductNameEn(d.productName.en);
        setProductDescriptionEn(d.description.en);
        setProductNameAr(d.productName.ar);
        setProductDescriptionAr(d.description.ar);

        setSelectedCategory({ label: d.category, value: d.category });
        setSelectedSubCategory({ label: d.subCategory, value: d.subCategory });
        setSelectedSizes(d.sizes.map((s) => ({ label: s, value: s })));
        setSelectedColors(d.colors.map((c) => ({ label: c, value: c })));
        setSelectedMainLocation({
          label: d.mainLocation,
          value: d.mainLocation,
        });

        // images
        setMainImagePreview(d.mainImageUrl);
        const previews = {};
        const ids = [];
        d.additionalImageUrls.forEach((url, idx) => {
          const newId = Date.now() + idx;
          previews[newId] = url;
          ids.push({ id: newId });
        });
        setAdditionalImagePreviews(previews);
        setAdditionalImages(ids);

        // price tiers
        setPriceTiers(
          d.priceRanges.map((tr) => ({
            id: Date.now() + Math.random(),
            minQty: { label: tr.minQty, value: tr.minQty },
            maxQty: { label: tr.maxQty, value: tr.maxQty },
            price: { label: tr.price, value: tr.price },
            deliveryLocations: tr.locations.map((loc) => ({
              id: Date.now() + Math.random(),
              location: { label: loc.location, value: loc.location },
              price: { label: loc.locationPrice, value: loc.locationPrice },
            })),
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProduct();
  }, [id, router]);

  // Handlers for dynamic lists…
  const handleAddImage = () =>
    setAdditionalImages((prev) =>
      prev.length < 4
        ? [...prev, { id: Date.now() }]
        : (toast.error("Max 4 images"), prev)
    );
  const handleRemoveImage = (id) =>
    setAdditionalImages((prev) => prev.filter((i) => i.id !== id));
  const handleAddPriceTier = () =>
    setPriceTiers((prev) => [
      ...prev,
      {
        id: Date.now(),
        minQty: null,
        maxQty: null,
        price: null,
        deliveryLocations: [{ id: Date.now(), location: null, price: null }],
      },
    ]);
  const handleRemovePriceTier = (tierId) =>
    setPriceTiers((prev) => prev.filter((t) => t.id !== tierId));
  const handleTierFieldChange = (tierId, field, val) =>
    setPriceTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, [field]: val } : t))
    );
  const handleAddLocation = (tierId) =>
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              deliveryLocations: [
                ...t.deliveryLocations,
                { id: Date.now(), location: null, price: null },
              ],
            }
          : t
      )
    );
  const handleRemoveLocation = (tierId, locId) =>
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              deliveryLocations: t.deliveryLocations.filter(
                (l) => l.id !== locId
              ),
            }
          : t
      )
    );
  const handleLocationFieldChange = (tierId, locId, field, val) =>
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              deliveryLocations: t.deliveryLocations.map((l) =>
                l.id === locId ? { ...l, [field]: val } : l
              ),
            }
          : t
      )
    );

  // Clean for Firestore
  const cleanPriceRanges = (tiers) =>
    tiers.map((t) => ({
      minQty: t.minQty.value,
      maxQty: t.maxQty.value,
      price: parseFloat(t.price.value),
      locations: t.deliveryLocations.map((l) => ({
        location: l.location.value,
        locationPrice:
          l.price.value === "Unlimited"
            ? "Unlimited"
            : parseFloat(l.price.value),
      })),
    }));

  // Unified submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate
    if (
      !validateProduct({
        productNameEn,
        productNameAr,
        productDescriptionEn,
        productDescriptionAr,
        selectedCategory,
        selectedSubCategory,
        mainImageFile: isEditing ? null : mainImageFile,
        priceTiers,
      })
    ) {
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(isEditing ? "Updating…" : "Uploading…");

    try {
      // 1. images
      let mainUrl = mainImagePreview;
      if (!isEditing || mainImageFile) {
        mainUrl = await uploadImageToStorage(
          mainImageFile,
          `products/${Date.now()}_main.jpg`
        );
      }
      const addUrls = await Promise.all(
        additionalImages.map(({ id }, idx) => {
          const file = additionalImageFiles[id];
          if (!isEditing && !file && additionalImagePreviews[id]) {
            return additionalImagePreviews[id];
          }
          if (file) {
            return uploadImageToStorage(
              file,
              `products/${Date.now()}_add_${idx}.jpg`
            );
          }
          return additionalImagePreviews[id] || "";
        })
      );

      // 2. slug
      let slug = isEditing
        ? undefined
        : await (async () => {
            const base = generateSlug(productNameEn);
            return ensureUniqueSlug(base);
          })();

      // 3. assemble
      const payload = {
        productName: { en: productNameEn, ar: productNameAr },
        description: { en: productDescriptionEn, ar: productDescriptionAr },
        ...(slug && { slug }),
        category: selectedCategory.value,
        subCategory: selectedSubCategory.value,
        mainImageUrl: mainUrl,
        additionalImageUrls: addUrls,
        sizes: selectedSizes.map((s) => s.value),
        colors: selectedColors.map((c) => c.value),
        mainLocation: selectedMainLocation.value,
        supplierId: currentUser.uid,
        supplierName: currentUser.displayName,
        priceRanges: cleanPriceRanges(priceTiers),
        updatedAt: new Date(),
        ...(!isEditing && { createdAt: new Date() }),
      };

      // 4. Firestore
      if (isEditing) {
        await updateDoc(doc(db, "products", id), payload);
      } else {
        await addDoc(collection(db, "products"), payload);
      }

      toast.dismiss(loadingToast);
      toast.success(isEditing ? "Updated successfully!" : "Uploaded!");
      router.push(
        isEditing ? "/admin-dashboard/products" : "/supplier-dashboard/products"
      );
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(isEditing ? "Update failed." : "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className='p-4 text-center'>
        <Loader2 className='mx-auto animate-spin' /> Loading…
      </div>
    );
  }

  if (currentUser?.role !== "admin") return <div>You are not authorized.</div>;

  return (
    <form onSubmit={handleSubmit} className='max-w-3xl mx-auto p-4 space-y-6'>
      <h2 className='text-2xl font-bold text-[#2c6449]'>
        {isEditing ? "Edit Product" : "Upload Product"}
      </h2>

      {/* — Basic Info — */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Input
          placeholder='Product Name (EN)'
          value={productNameEn}
          onChange={(e) => setProductNameEn(e.target.value)}
        />
        <Input
          placeholder='Product Name (AR)'
          value={productNameAr}
          onChange={(e) => setProductNameAr(e.target.value)}
        />
        <textarea
          rows={2}
          className='border px-3 py-2 rounded w-full'
          placeholder='Description (EN)'
          value={productDescriptionEn}
          onChange={(e) => setProductDescriptionEn(e.target.value)}
        />
        <textarea
          rows={2}
          className='border px-3 py-2 rounded w-full'
          placeholder='Description (AR)'
          value={productDescriptionAr}
          onChange={(e) => setProductDescriptionAr(e.target.value)}
        />
      </div>

      {/* — Category / Subcategory / Location / Sizes / Colors — */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <CreatableSelect
          options={categoryOptions}
          value={selectedCategory}
          onChange={(opt) => {
            setSelectedCategory(opt);
            setSelectedSubCategory(null);
          }}
          placeholder='Category'
        />
        <CreatableSelect
          isDisabled={!selectedCategory}
          options={subCategoryMap[selectedCategory?.value] || []}
          value={selectedSubCategory}
          onChange={(opt) => setSelectedSubCategory(opt)}
          placeholder='Subcategory'
        />
        <CreatableSelect
          options={defaultLocationOptions}
          value={selectedMainLocation}
          onChange={(opt) => setSelectedMainLocation(opt)}
          placeholder='Main Location'
        />
        <CreatableSelect
          isMulti
          options={defaultSizeOptions}
          value={selectedSizes}
          onChange={setSelectedSizes}
          placeholder='Sizes'
        />
        <CreatableSelect
          isMulti
          options={defaultColorOptions}
          value={selectedColors}
          onChange={setSelectedColors}
          placeholder='Colors'
        />
      </div>

      {/* — Images — */}
      <div className='space-y-4'>
        <h3 className='font-semibold'>Product Images</h3>

        {/* Main */}
        <div>
          <Label>Main Image</Label>
          <Input
            type='file'
            accept='image/*'
            onChange={(e) => {
              const f = e.target.files[0];
              setMainImageFile(f);
              const reader = new FileReader();
              reader.onloadend = () => setMainImagePreview(reader.result);
              reader.readAsDataURL(f);
            }}
          />
          {mainImagePreview && (
            <img
              src={mainImagePreview}
              className='mt-2 w-32 h-32 object-cover rounded'
            />
          )}
        </div>

        {/* Additional */}
        <div>
          <Label>Additional Images</Label>
          {additionalImages.map((img) => (
            <div key={img.id} className='flex items-center gap-2 my-2'>
              <Input
                type='file'
                accept='image/*'
                onChange={(e) => {
                  const f = e.target.files[0];
                  setAdditionalImageFiles((prev) => ({ ...prev, [img.id]: f }));
                  const reader = new FileReader();
                  reader.onloadend = () =>
                    setAdditionalImagePreviews((prev) => ({
                      ...prev,
                      [img.id]: reader.result,
                    }));
                  reader.readAsDataURL(f);
                }}
              />
              {additionalImagePreviews[img.id] && (
                <img
                  src={additionalImagePreviews[img.id]}
                  className='w-16 h-16 object-cover rounded'
                />
              )}
              <Button
                variant='ghost'
                type='button'
                className='text-red-600'
                onClick={() => handleRemoveImage(img.id)}
              >
                Remove
              </Button>
            </div>
          ))}
          {additionalImages.length < 4 && (
            <Button variant='link' type='button' onClick={handleAddImage}>
              + Add Additional Image
            </Button>
          )}
        </div>
      </div>

      {/* — Pricing Tiers — */}
      <div className='border p-4 rounded space-y-6'>
        {priceTiers.map((tier) => (
          <div key={tier.id} className='space-y-4 border-b pb-4'>
            <div className='flex justify-between items-center'>
              <h4 className='font-medium'>Price Tier</h4>
              <Button
                variant='ghost'
                size='sm'
                className='text-red-600'
                type='button'
                onClick={() => handleRemovePriceTier(tier.id)}
              >
                Remove
              </Button>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <CreatableSelect
                placeholder='Min Qty'
                options={defaultQuantityOptions}
                value={tier.minQty}
                onChange={(opt) =>
                  handleTierFieldChange(tier.id, "minQty", opt)
                }
              />
              <CreatableSelect
                placeholder='Max Qty'
                options={defaultQuantityOptions}
                value={tier.maxQty}
                onChange={(opt) =>
                  handleTierFieldChange(tier.id, "maxQty", opt)
                }
              />
              <CreatableSelect
                placeholder='Price'
                options={defaultQuantityOptions}
                value={tier.price}
                onChange={(opt) => handleTierFieldChange(tier.id, "price", opt)}
              />
            </div>

            <div>
              <Label>Delivery Locations</Label>
              {tier.deliveryLocations.map((loc) => (
                <div key={loc.id} className='flex items-center gap-2 my-2'>
                  <CreatableSelect
                    placeholder='Location'
                    options={defaultLocationOptions}
                    value={loc.location}
                    onChange={(opt) =>
                      handleLocationFieldChange(
                        tier.id,
                        loc.id,
                        "location",
                        opt
                      )
                    }
                  />
                  <CreatableSelect
                    placeholder='Price'
                    options={defaultQuantityOptions}
                    value={loc.price}
                    onChange={(opt) =>
                      handleLocationFieldChange(tier.id, loc.id, "price", opt)
                    }
                  />
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-red-600'
                    type='button'
                    onClick={() => handleRemoveLocation(tier.id, loc.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant='link'
                size='sm'
                type='button'
                onClick={() => handleAddLocation(tier.id)}
              >
                + Add Location
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant='outline'
          size='sm'
          type='button'
          onClick={handleAddPriceTier}
        >
          + Add Price Tier
        </Button>
      </div>

      {/* — Submit Button — */}
      <div className='text-center'>
        <Button
          type='submit'
          disabled={isSubmitting}
          className='flex items-center justify-center gap-2 w-full bg-[#2c6449] text-white'
        >
          {isSubmitting && <Loader2 className='animate-spin' size={16} />}
          {isSubmitting
            ? isEditing
              ? "Updating…"
              : "Uploading…"
            : isEditing
            ? "Save Changes"
            : "Upload Product"}
        </Button>
      </div>
    </form>
  );
}
