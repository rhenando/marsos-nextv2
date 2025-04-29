"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toastUtils";

export default function Buyer() {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    address: "",
    crNumber: "",
    crLicenseFile: null,
    bankAccount: "",
    bankName: "",
    accountHolderName: "",
  });

  const [uploadFileName, setUploadFileName] = useState("");
  const { t } = useTranslation();
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, crLicenseFile: e.target.files[0] }));
      setUploadFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      showError("Authentication Required. Please login first.");
      router.push("/user-login");
      return;
    }

    const fullPhoneNumber = localStorage.getItem("userPhone");
    if (!fullPhoneNumber) {
      showError("Phone number not found. Please login again.");
      router.push("/user-login");
      return;
    }

    const uid = user.uid || uuidv4();
    const role = "buyer";

    try {
      let crLicenseURL = "";
      if (formData.crLicenseFile) {
        const storage = getStorage();
        const fileRef = ref(
          storage,
          `crLicenses/${uid}-${formData.crLicenseFile.name}`
        );
        await uploadBytes(fileRef, formData.crLicenseFile);
        crLicenseURL = await getDownloadURL(fileRef);
      }

      await setDoc(
        doc(db, "users", uid),
        {
          role,
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: fullPhoneNumber,
          buyerId: uid,
          address: formData.address,
          crNumber: formData.crNumber,
          crLicenseURL,
          bankAccount: formData.bankAccount,
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
        },
        { merge: true }
      );

      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      showSuccess("Registration complete! Redirecting...");
      router.push("/");
    } catch (error) {
      console.error("Error adding buyer to Firestore:", error);
      showError("Registration failed. Try again.");
    }
  };

  return (
    <div className='flex flex-col md:flex-row min-h-screen'>
      {/* Left Side */}
      <div className='flex-1 flex flex-col items-center justify-center bg-gray-50 p-6'>
        <div className='text-center mb-6'>
          <Image
            src='/logo.svg'
            alt='Logo'
            width={60}
            height={60}
            className='mx-auto mb-2'
          />
          <h2 className='text-lg font-bold text-[#2d6a4f]'>
            {t("buyer_registration.title")}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className='w-full max-w-md bg-white p-6 rounded shadow space-y-4'
        >
          <div className='flex gap-2'>
            <Input
              type='text'
              placeholder={t("buyer_registration.name")}
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              required
              className='text-sm'
            />
            <Input
              type='text'
              placeholder={t("buyer_registration.surname")}
              name='surname'
              value={formData.surname}
              onChange={handleInputChange}
              required
              className='text-sm'
            />
          </div>

          <Input
            type='email'
            placeholder={t("buyer_registration.email")}
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            required
            className='text-sm'
          />

          <Input
            type='text'
            placeholder={t("buyer_registration.address")}
            name='address'
            value={formData.address}
            onChange={handleInputChange}
            required
            className='text-sm'
          />

          <Input
            type='text'
            placeholder={t("buyer_registration.crNumber")}
            name='crNumber'
            value={formData.crNumber}
            onChange={handleInputChange}
            required
            className='text-sm'
          />

          {/* Upload */}
          <div className='flex items-center gap-2'>
            <input
              type='file'
              id='fileUpload'
              className='hidden'
              onChange={handleFileChange}
              required
            />
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => document.getElementById("fileUpload").click()}
              className='text-xs'
            >
              {t("buyer_registration.choose_file")}
            </Button>
            <span className='text-xs text-gray-600 truncate max-w-[150px]'>
              {uploadFileName || t("buyer_registration.no_file_chosen")}
            </span>
          </div>

          <Input
            type='text'
            placeholder={t("buyer_registration.bank_account")}
            name='bankAccount'
            value={formData.bankAccount}
            onChange={handleInputChange}
            required
            className='text-sm'
          />

          <Input
            type='text'
            placeholder={t("buyer_registration.bank_name")}
            name='bankName'
            value={formData.bankName}
            onChange={handleInputChange}
            required
            className='text-sm'
          />

          <Input
            type='text'
            placeholder={t("buyer_registration.account_holder")}
            name='accountHolderName'
            value={formData.accountHolderName}
            onChange={handleInputChange}
            required
            className='text-sm'
          />

          <Button
            type='submit'
            className='w-full bg-[#2d6a4f] hover:bg-[#245e45]'
          >
            {t("buyer_registration.continue")}
          </Button>
        </form>
      </div>

      {/* Right Side */}
      <div className='hidden md:flex flex-1 bg-gradient-to-r from-gray-100 to-[#2c6449]' />
    </div>
  );
}
