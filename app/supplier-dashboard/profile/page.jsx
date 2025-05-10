"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function ManageProfiles() {
  const { user: currentUser, loading: authLoading } = useSelector(
    (s) => s.auth
  );
  const [formData, setFormData] = useState({
    nameEn: "",
    nameAr: "",
    addressEn: "",
    addressAr: "",
    companyDescriptionEn: "",
    companyDescriptionAr: "",
    crNumber: "",
    vatNumber: "",
    email: "",
    role: "",
    logoUrl: "",
    crDocUrl: "",
    vatDocUrl: "",
    brochureUrls: [], // ← multiple brochures
    bankDetails: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // ─── Fetch existing profile ───────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) {
        const d = snap.data();
        setFormData((f) => ({
          ...f,
          nameEn: d.nameEn || d.name || "",
          nameAr: d.nameAr || "",
          addressEn: d.addressEn || d.address || "",
          addressAr: d.addressAr || "",
          companyDescriptionEn:
            d.companyDescriptionEn || d.companyDescription || "",
          companyDescriptionAr: d.companyDescriptionAr || "",
          crNumber: d.crNumber || "",
          vatNumber: d.vatNumber || "",
          email: d.email || "",
          role: d.role || "",
          logoUrl: d.logoUrl || "",
          crDocUrl: d.crDocUrl || "",
          vatDocUrl: d.vatDocUrl || "",
          brochureUrls:
            d.brochureUrls || (d.brochureUrl ? [d.brochureUrl] : []),
          bankDetails: d.bankDetails || [],
        }));
      }
      setLoading(false);
    })();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  // ─── Upload logo ──────────────────────────────────────
  const handleLogoUpload = (file) => {
    if (!file || !currentUser?.uid) return;
    setUploading(true);
    const storage = getStorage();
    const fileRef = ref(
      storage,
      `profiles/${currentUser.uid}/logo/${file.name}`
    );
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      null,
      () => {
        toast.error("Logo upload failed.");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((f) => ({ ...f, logoUrl: url }));
        toast.success("Logo uploaded!");
        setUploading(false);
      }
    );
  };

  // ─── Upload CR / VAT docs ────────────────────────────
  const handleFileUpload = (file, key) => {
    if (!file || !currentUser?.uid) return;
    setUploading(true);
    const storage = getStorage();
    const fileRef = ref(
      storage,
      `profiles/${currentUser.uid}/${key}/${file.name}`
    );
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      null,
      () => {
        toast.error(`${key} upload failed.`);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((f) => ({ ...f, [key]: url }));
        toast.success(`${key} uploaded!`);
        setUploading(false);
      }
    );
  };

  // ─── Upload multiple brochures ───────────────────────
  const handleBrochureUpload = (file, idx) => {
    if (!file || !currentUser?.uid) return;
    setUploading(true);
    const storage = getStorage();
    const fileRef = ref(
      storage,
      `profiles/${currentUser.uid}/brochures/${file.name}`
    );
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      null,
      () => {
        toast.error("Brochure upload failed.");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((f) => {
          const arr = [...f.brochureUrls];
          arr[idx] = url;
          return { ...f, brochureUrls: arr };
        });
        toast.success("Brochure uploaded!");
        setUploading(false);
      }
    );
  };

  // ─── Save all changes ─────────────────────────────────
  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        nameEn: formData.nameEn,
        nameAr: formData.nameAr,
        addressEn: formData.addressEn,
        addressAr: formData.addressAr,
        companyDescriptionEn: formData.companyDescriptionEn,
        companyDescriptionAr: formData.companyDescriptionAr,
        crNumber: formData.crNumber,
        vatNumber: formData.vatNumber,
        logoUrl: formData.logoUrl,
        crDocUrl: formData.crDocUrl,
        vatDocUrl: formData.vatDocUrl,
        brochureUrls: formData.brochureUrls,
        bankDetails: formData.bankDetails,
      });
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  // 1) while auth is initializing
  if (authLoading) {
    return <div>Loading…</div>;
  }

  // 2) once loaded, only admins (suppliers in this dashboard) get in
  if (currentUser?.role !== "supplier") {
    return <div>You are not authorized.</div>;
  }

  return (
    <Card className='max-w-4xl mx-auto my-8 p-4'>
      <CardHeader>
        <CardTitle>Manage Profile</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Name */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>Name (EN)</Label>
            <Input
              className='w-full'
              name='nameEn'
              value={formData.nameEn}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div className='text-right'>
            <Label className='float-right'>الاسم (ع)</Label>
            <Input
              className='w-full text-right'
              name='nameAr'
              value={formData.nameAr}
              onChange={handleChange}
              disabled={!isEditing}
              dir='rtl'
            />
          </div>
        </div>

        {/* Address */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>Address (EN)</Label>
            <Input
              className='w-full'
              name='addressEn'
              value={formData.addressEn}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div className='text-right'>
            <Label className='float-right'>العنوان (ع)</Label>
            <Input
              className='w-full text-right'
              name='addressAr'
              value={formData.addressAr}
              onChange={handleChange}
              disabled={!isEditing}
              dir='rtl'
            />
          </div>
        </div>

        {/* Company Description */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>Description (EN)</Label>
            <Textarea
              className='w-full'
              name='companyDescriptionEn'
              value={formData.companyDescriptionEn}
              onChange={handleChange}
              disabled={!isEditing}
              rows={4}
            />
          </div>
          <div className='text-right'>
            <Label className='float-right'>الوصف (ع)</Label>
            <Textarea
              className='w-full text-right'
              name='companyDescriptionAr'
              value={formData.companyDescriptionAr}
              onChange={handleChange}
              disabled={!isEditing}
              rows={4}
              dir='rtl'
            />
          </div>
        </div>

        {/* CR & VAT Numbers */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>CR Number</Label>
            <Input
              className='w-full'
              name='crNumber'
              value={formData.crNumber}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>VAT Number</Label>
            <Input
              className='w-full'
              name='vatNumber'
              value={formData.vatNumber}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Logo + Documents */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Logo */}
          <div>
            <Label>Logo</Label>
            {formData.logoUrl && (
              <img
                src={formData.logoUrl}
                alt='Company Logo'
                className='w-24 h-24 md:w-32 md:h-32 object-contain mb-2'
              />
            )}
            <Input
              className='w-full'
              type='file'
              accept='image/*'
              onChange={(e) => handleLogoUpload(e.target.files[0])}
              disabled={!isEditing || uploading}
            />
          </div>

          {/* Documents */}
          <div>
            <Label>Company Docs</Label>
            <div className='space-y-4'>
              {/* CR Document */}
              <div>
                <Label>CR Document (PDF/JPG)</Label>
                {formData.crDocUrl && (
                  <a
                    href={formData.crDocUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block text-sm text-blue-600 underline mb-1'
                  >
                    View existing CR
                  </a>
                )}
                <Input
                  className='w-full'
                  type='file'
                  accept='.pdf,.jpg,.jpeg'
                  onChange={(e) =>
                    handleFileUpload(e.target.files[0], "crDocUrl")
                  }
                  disabled={!isEditing || uploading}
                />
              </div>

              {/* VAT Registration */}
              <div>
                <Label>VAT Registration (PDF/JPG)</Label>
                {formData.vatDocUrl && (
                  <a
                    href={formData.vatDocUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block text-sm text-blue-600 underline mb-1'
                  >
                    View existing VAT
                  </a>
                )}
                <Input
                  className='w-full'
                  type='file'
                  accept='.pdf,.jpg,.jpeg'
                  onChange={(e) =>
                    handleFileUpload(e.target.files[0], "vatDocUrl")
                  }
                  disabled={!isEditing || uploading}
                />
              </div>

              {/* Multiple Brochures */}
              <div>
                <Label>Brochures/Profiles (PDF/JPG)</Label>
                <div className='space-y-4'>
                  {formData.brochureUrls.map((url, idx) => (
                    <div key={idx}>
                      {url && (
                        <a
                          href={url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='block text-sm text-blue-600 underline mb-1'
                        >
                          View Brochure {idx + 1}
                        </a>
                      )}
                      <Input
                        className='w-full'
                        type='file'
                        accept='.pdf,.jpg,.jpeg'
                        onChange={(e) =>
                          handleBrochureUpload(e.target.files[0], idx)
                        }
                        disabled={!isEditing || uploading}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  className='mt-2 w-full md:w-auto'
                  variant='outline'
                  onClick={() =>
                    setFormData((f) => ({
                      ...f,
                      brochureUrls: [...f.brochureUrls, ""],
                    }))
                  }
                  disabled={!isEditing}
                >
                  + Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-col sm:flex-row items-center gap-4'>
          {isEditing ? (
            <>
              <Button
                className='w-full sm:w-auto'
                onClick={handleSave}
                disabled={uploading}
              >
                Save
              </Button>
              <Button
                className='w-full sm:w-auto'
                variant='outline'
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              className='w-full sm:w-auto'
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
