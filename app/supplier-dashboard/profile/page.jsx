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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManageProfiles() {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    role: "",
    crNumber: "",
    vatNumber: "",
    logoUrl: "",
    companyDescription: "",
    bankDetails: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    if (!currentUser) return;

    try {
      const docRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setFormData({
          ...formData,
          ...data,
          bankDetails: data.bankDetails || [],
        });
      }
    } catch (err) {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleLogoUpload = async (file) => {
    if (!file || !currentUser?.uid) return;
    setUploading(true);

    const storage = getStorage();
    const fileRef = ref(storage, `logos/${currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      null,
      () => toast.error("Upload failed."),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((f) => ({ ...f, logoUrl: url }));
        toast.success("Logo uploaded!");
        setUploading(false);
      }
    );
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        ...formData,
      });
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile.");
    }
  };

  if (loading) return <p className='text-center text-muted'>Loading...</p>;

  return (
    <Card className='max-w-4xl mx-auto my-8'>
      <CardHeader>
        <CardTitle>Manage Profile</CardTitle>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>Name</Label>
            <Input
              name='name'
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              name='email'
              value={formData.email}
              onChange={handleChange}
              disabled
            />
          </div>
          <div>
            <Label>Role</Label>
            <Input
              name='role'
              value={formData.role}
              onChange={handleChange}
              disabled
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              name='address'
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>CR Number</Label>
            <Input
              name='crNumber'
              value={formData.crNumber}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>VAT Number</Label>
            <Input
              name='vatNumber'
              value={formData.vatNumber}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div>
          <Label>Company Description</Label>
          <Textarea
            name='companyDescription'
            value={formData.companyDescription}
            onChange={handleChange}
            rows={4}
            disabled={!isEditing}
          />
        </div>

        <div>
          <Label>Logo</Label>
          {formData.logoUrl && (
            <img
              src={formData.logoUrl}
              alt='Company Logo'
              className='w-32 h-32 object-contain mb-2'
            />
          )}
          <Input
            type='file'
            accept='image/*'
            onChange={(e) => handleLogoUpload(e.target.files[0])}
            disabled={!isEditing}
          />
        </div>

        <div className='flex items-center gap-4'>
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={uploading}>
                Save
              </Button>
              <Button variant='outline' onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
