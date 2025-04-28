"use client";

import { useState, useEffect, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { db, storage } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation"; // ✅ replacing useNavigate
import countryList from "react-select-country-list";
import { showSuccess, showError, showWarning } from "../../utils/toastUtils"; // adjust if needed

const RfqModal = ({ show, onClose }) => {
  const { currentUser } = useAuth();
  const router = useRouter(); // ✅ replacing navigate

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [productDetails, setProductDetails] = useState("");
  const [shareBusinessCard, setShareBusinessCard] = useState(false);
  const [categorySuppliers, setCategorySuppliers] = useState({});
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [shipping, setShipping] = useState(
    countryList()
      .getData()
      .find((c) => c.label === "Saudi Arabia")
  );
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const countryOptions = useMemo(() => countryList().getData(), []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const categoryMap = {};
        const categoryList = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.category && data.supplierName && data.supplierId) {
            if (!categoryList.find((c) => c.value === data.category)) {
              categoryList.push({ value: data.category, label: data.category });
            }
            if (!categoryMap[data.category]) {
              categoryMap[data.category] = new Map();
            }
            categoryMap[data.category].set(data.supplierId, {
              supplierName: data.supplierName,
              supplierId: data.supplierId,
            });
          }
        });

        const cleanedCategorySuppliers = {};
        Object.keys(categoryMap).forEach((category) => {
          cleanedCategorySuppliers[category] = Array.from(
            categoryMap[category].values()
          );
        });

        setCategories(categoryList);
        setCategorySuppliers(cleanedCategorySuppliers);
      } catch (error) {
        showError("Failed to fetch categories.");
      }
    };

    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setUploading(true);
    setFile(selectedFile);

    const storageRef = ref(
      storage,
      `rfq_files/${currentUser.uid}/${selectedFile.name}`
    );
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        showError("File upload failed.");
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFileURL(downloadURL);
        showSuccess("File uploaded successfully.");
        setUploading(false);
      }
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedCategory) newErrors.selectedCategory = "Category is required.";
    if (!selectedSubcategory)
      newErrors.selectedSubcategory = "Subcategory is required.";
    if (!productDetails.trim())
      newErrors.productDetails = "Product details are required.";
    if (!file) newErrors.file = "Please select a file.";
    if (file && !fileURL && !uploading)
      newErrors.file = "File not uploaded. Please wait or reselect.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return showWarning("You must be logged in.");

    const isValid = validateForm();
    if (!isValid || uploading) return;

    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (!userSnap.exists()) return showError("User not found.");

      const userData = userSnap.data();
      const userRole = userData.role || "buyer";

      const suppliers = categorySuppliers[selectedCategory.value] || [];
      if (suppliers.length === 0) return showError("No suppliers found.");

      const rfqPromises = suppliers.map(async (supplier) => {
        const docRef = await addDoc(collection(db, "rfqs"), {
          buyerId: currentUser.uid,
          category: selectedCategory.value,
          subcategory: selectedSubcategory.value,
          productDetails,
          fileURL,
          size,
          color,
          shipping: shipping.label,
          shareBusinessCard,
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          timestamp: new Date(),
        });

        const chatId = `chat_${currentUser.uid}_${supplier.supplierId}`;
        const chatRef = doc(db, "rfqChats", chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          await setDoc(chatRef, {
            chatId,
            buyerId: currentUser.uid,
            supplierId: supplier.supplierId,
            supplierName: supplier.supplierName,
            messages: [],
            createdAt: new Date(),
            rfqId: docRef.id,
          });
        }
      });

      await Promise.all(rfqPromises);
      showSuccess("RFQs sent successfully!");
      setShowSuccessScreen(true);

      setTimeout(() => {
        onClose();
        router.push(
          userRole === "buyer" ? "/buyer-dashboard" : "/supplier-dashboard"
        );
      }, 1500);
    } catch (error) {
      console.error(error);
      showError("Submission failed. Try again.");
    }
  };

  if (!show) return null;

  if (showSuccessScreen) {
    return (
      <div className='fixed inset-0 bg-[#2c6449]/30 flex items-center justify-center z-[9999]'>
        <div className='text-center'>
          <svg
            className='w-16 h-16 text-[#2c6449] animate-bounce mx-auto'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 13l4 4L19 7'
            />
          </svg>
          <h3 className='text-lg text-[#2c6449] font-semibold mt-4'>
            RFQ submitted successfully!
          </h3>
          <p className='text-gray-500 text-sm mt-1'>
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-[#2c6449]/30 flex items-center justify-center z-50'>
      <div className='bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-auto max-h-[90vh]'>
        <div className='flex justify-between items-center p-4 border-b'>
          <h2 className='text-lg font-semibold'>Request for Quotation</h2>
          <button onClick={onClose} className='text-gray-600 hover:text-black'>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className='p-4 space-y-4 text-sm'>
          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <label className='font-medium'>Product Category *</label>
              <Select
                options={categories}
                value={selectedCategory}
                onChange={setSelectedCategory}
                isClearable
              />
              {errors.selectedCategory && (
                <p className='text-red-500 text-xs'>
                  {errors.selectedCategory}
                </p>
              )}
            </div>
            <div>
              <label className='font-medium'>Product Subcategory *</label>
              <CreatableSelect
                options={subcategoryOptions}
                value={selectedSubcategory}
                onChange={setSelectedSubcategory}
                onCreateOption={(val) => {
                  const newOption = { value: val, label: val };
                  setSubcategoryOptions((prev) => [...prev, newOption]);
                  setSelectedSubcategory(newOption);
                }}
                isClearable
              />
              {errors.selectedSubcategory && (
                <p className='text-red-500 text-xs'>
                  {errors.selectedSubcategory}
                </p>
              )}
            </div>
          </div>

          {/* Size, Color, Shipping */}
          <div className='grid md:grid-cols-3 gap-4'>
            <div>
              <label className='font-medium'>Size</label>
              <input
                type='text'
                className='w-full border rounded p-2'
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
            <div>
              <label className='font-medium'>Color</label>
              <input
                type='text'
                className='w-full border rounded p-2'
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div>
              <label className='font-medium'>Shipping To</label>
              <Select
                options={countryOptions}
                value={shipping}
                onChange={setShipping}
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className='font-medium'>
              Detailed Product Requirements *
            </label>
            <textarea
              className='w-full border rounded p-2'
              rows='3'
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
            />
            {errors.productDetails && (
              <p className='text-red-500 text-xs'>{errors.productDetails}</p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className='font-medium'>Upload File *</label>
            <input
              type='file'
              accept='.jpg,.png,.pdf,.docx'
              className='w-full border p-2'
              onChange={handleFileChange}
            />
            {uploading && (
              <p className='text-blue-500 text-xs'>
                Uploading... {Math.round(uploadProgress)}%
              </p>
            )}
            {fileURL && !uploading && (
              <p className='text-green-500 text-xs'>File uploaded ✔</p>
            )}
            {errors.file && (
              <p className='text-red-500 text-xs'>{errors.file}</p>
            )}
          </div>

          {/* Share Business Card */}
          <div className='flex items-center space-x-2'>
            <input
              id='shareBusinessCard'
              type='checkbox'
              checked={shareBusinessCard}
              onChange={() => setShareBusinessCard(!shareBusinessCard)}
              className='w-4 h-4'
            />
            <label htmlFor='shareBusinessCard' className='text-sm'>
              I agree to share my contact details with suppliers
            </label>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={uploading}
            className='bg-[#2c6449] text-white px-4 py-2 rounded hover:bg-opacity-90'
          >
            {uploading ? "Uploading..." : "Submit RFQ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RfqModal;
