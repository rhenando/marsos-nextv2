"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

const BecomeSupplierForm = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const categorySet = new Set();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.category) {
            categorySet.add(data.category);
          }
        });
        setCategories([...categorySet]);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const [formData, setFormData] = useState({
    companyName: "",
    crNumber: "",
    crDocument: null,
    vatNumber: "",
    representativeName: "",
    representativeEmail: "",
    representativePhone: "",
    fullAddress: "",
    city: "",
    region: "",
    mainCategory: "",
    exportCountries: "",
    productionCapacity: "",
    shippingMethod: "Sea freight",
    paymentTerms: "T/T",
    bankName: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",
    accountHolderName: "",
    leadTime: "",
    productImages: [],
    description: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "productImages") {
      setFormData({ ...formData, productImages: files });
    } else if (name === "crDocument") {
      setFormData({ ...formData, crDocument: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted data:", formData);
  };

  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 bg-white shadow rounded-lg'>
      <h2 className='text-2xl font-bold text-[#2c6449] mb-6'>
        Become a Supplier
      </h2>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Company Info */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Input
            name='companyName'
            label='Company Name *'
            value={formData.companyName}
            onChange={handleChange}
            required
          />
          <Input
            name='crNumber'
            label='Commercial Registration (CR) Number *'
            value={formData.crNumber}
            onChange={handleChange}
            required
          />
          <Input
            name='vatNumber'
            label='VAT Registration Number *'
            value={formData.vatNumber}
            onChange={handleChange}
            required
          />
        </div>

        {/* Upload CR Document */}
        <FileInput
          name='crDocument'
          label='Upload CR Document *'
          onChange={handleChange}
          file={formData.crDocument}
          accept='.pdf,.jpg,.jpeg,.png'
          required
        />

        {/* Representative */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Input
            name='representativeName'
            label='Representative Name *'
            value={formData.representativeName}
            onChange={handleChange}
            required
          />
          <Input
            name='representativeEmail'
            type='email'
            label='Work Email *'
            value={formData.representativeEmail}
            onChange={handleChange}
            required
          />
          <Input
            name='representativePhone'
            type='tel'
            label='Phone Number *'
            value={formData.representativePhone}
            onChange={handleChange}
            required
          />
        </div>

        {/* Address */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Input
            name='fullAddress'
            label='Full Address *'
            value={formData.fullAddress}
            onChange={handleChange}
            required
          />
          <Input
            name='city'
            label='City *'
            value={formData.city}
            onChange={handleChange}
            required
          />
          <Input
            name='region'
            label='Region *'
            value={formData.region}
            onChange={handleChange}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className='block text-sm font-semibold mb-1'>
            Main Product Category *
          </label>
          <select
            name='mainCategory'
            value={formData.mainCategory}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
            required
          >
            <option value=''>Select a category</option>
            {categories.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <Input
          name='exportCountries'
          label='Export Countries'
          value={formData.exportCountries}
          onChange={handleChange}
          placeholder='e.g., Saudi Arabia, UAE'
        />
        <Input
          name='productionCapacity'
          label='Monthly Production Capacity *'
          value={formData.productionCapacity}
          onChange={handleChange}
          required
        />

        {/* Shipping + Payment */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Select
            name='shippingMethod'
            label='Shipping Method *'
            value={formData.shippingMethod}
            onChange={handleChange}
            options={["Sea freight", "Air freight", "Courier"]}
          />
          <Select
            name='paymentTerms'
            label='Payment Method *'
            value={formData.paymentTerms}
            onChange={handleChange}
            options={["T/T", "L/C"]}
          />
        </div>

        {/* Lead Time */}
        <Input
          name='leadTime'
          type='number'
          label='Approximate Delivery Time (days) *'
          value={formData.leadTime}
          onChange={handleChange}
          required
        />

        {/* Bank Details */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Input
            name='bankName'
            label='Bank Name *'
            value={formData.bankName}
            onChange={handleChange}
            required
          />
          <Input
            name='accountNumber'
            label='Account Number *'
            value={formData.accountNumber}
            onChange={handleChange}
            required
          />
          <Input
            name='accountHolderName'
            label='Account Holder Name *'
            value={formData.accountHolderName}
            onChange={handleChange}
            required
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            name='iban'
            label='IBAN *'
            value={formData.iban}
            onChange={handleChange}
            required
          />
          <Input
            name='swiftCode'
            label='Swift Code *'
            value={formData.swiftCode}
            onChange={handleChange}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className='block text-sm font-semibold mb-1'>
            Company/Product Description *
          </label>
          <textarea
            name='description'
            value={formData.description}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded h-28'
            placeholder='Describe your company, production, certifications, etc.'
            required
          />
        </div>

        {/* Product Images */}
        <FileInput
          name='productImages'
          label='Upload Product Images'
          onChange={handleChange}
          multiple
        />

        {/* Submit */}
        <div className='text-center'>
          <button
            type='submit'
            className='bg-[#2c6449] hover:bg-[#1b4533] text-white font-semibold py-2 px-6 rounded transition-all'
          >
            Submit Registration
          </button>
        </div>
      </form>
    </div>
  );
};

// Reusable Input Component
const Input = ({ name, label, type = "text", ...rest }) => (
  <div>
    <label className='block text-sm font-semibold mb-1'>{label}</label>
    <input
      type={type}
      name={name}
      className='w-full border border-gray-300 p-2 rounded'
      {...rest}
    />
  </div>
);

// Reusable Select Component
const Select = ({ name, label, value, onChange, options }) => (
  <div>
    <label className='block text-sm font-semibold mb-1'>{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className='w-full border border-gray-300 p-2 rounded'
    >
      {options.map((opt, i) => (
        <option key={i} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

// Reusable FileInput
const FileInput = ({
  name,
  label,
  onChange,
  file,
  multiple = false,
  accept,
  required,
}) => (
  <div>
    <label className='block text-sm font-semibold mb-1'>{label}</label>
    <input
      type='file'
      name={name}
      onChange={onChange}
      className='w-full border border-gray-300 p-2 rounded'
      multiple={multiple}
      accept={accept}
      required={required}
    />
    {file && (
      <p className='text-sm text-green-600 mt-1'>Uploaded: {file.name}</p>
    )}
  </div>
);

export default BecomeSupplierForm;
