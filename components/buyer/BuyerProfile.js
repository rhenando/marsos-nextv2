"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db } from "@/firebase/config"; // adjust if needed
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { showSuccess, showError, showPromiseToast } from "@/utils/toastUtils";

const BuyerProfile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    crNumber: "",
    vatNumber: "",
    logoUrl: "",
  });

  const storage = getStorage();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setError(t("buyer_profile.errors.no_user_logged_in"));
        setLoading(false);
        return;
      }

      try {
        const userDoc = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          setProfile({ id: userSnapshot.id, ...data });
          setFormData({
            name: data.name || "",
            email: data.email || "",
            address: data.address || "",
            phone: data.phone || "",
            crNumber: data.crNumber || "",
            vatNumber: data.vatNumber || "",
            logoUrl: data.logoUrl || "",
          });
        } else {
          setError(t("buyer_profile.errors.no_profile_found"));
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(t("buyer_profile.errors.failed_to_load_profile"));
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `logos/${currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Upload error:", error);
        showError("Failed to upload logo.");
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((prev) => ({ ...prev, logoUrl: downloadURL }));
        setUploading(false);
        showSuccess(t("buyer_profile.messages.logo_uploaded_success"));
      }
    );
  };

  const handleSave = async () => {
    if (!currentUser) {
      setError(t("buyer_profile.errors.no_user_logged_in"));
      return;
    }

    const userDoc = doc(db, "users", currentUser.uid);

    await showPromiseToast(updateDoc(userDoc, formData), {
      loading: t("buyer_profile.messages.loading"),
      success: t("buyer_profile.messages.profile_updated_success"),
      error: t("buyer_profile.errors.failed_to_update_profile"),
    });

    setProfile({ ...profile, ...formData });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <p className='text-gray-600'>{t("buyer_profile.messages.loading")}</p>
    );
  }

  if (error) {
    return <p className='text-red-600 font-medium'>{error}</p>;
  }

  return (
    <div className='p-4 md:p-6'>
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-2xl font-bold text-primary mb-6'>
          {t("buyer_profile.title")}
        </h2>

        {profile ? (
          <>
            {isEditing ? (
              <form className='space-y-4 transition-all duration-300 ease-in-out'>
                {[
                  "name",
                  "email",
                  "address",
                  "phone",
                  "crNumber",
                  "vatNumber",
                ].map((field) => (
                  <div key={field}>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t(`buyer_profile.fields.${field}`)}
                    </label>
                    <input
                      type='text'
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      className='w-full px-3 py-2 border rounded focus:outline-none focus:ring'
                    />
                  </div>
                ))}

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t("buyer_profile.fields.logo")}
                  </label>
                  {formData.logoUrl && (
                    <img
                      src={formData.logoUrl}
                      alt={t("buyer_profile.fields.current_logo")}
                      className='w-32 h-32 rounded object-cover mb-2'
                    />
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    className='block text-sm text-gray-600'
                  />
                  {uploading && (
                    <p className='text-sm text-gray-500 mt-1'>
                      {t("buyer_profile.actions.uploading_logo")}
                    </p>
                  )}
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={handleSave}
                    disabled={uploading}
                    className='bg-primary text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50 transition'
                  >
                    {t("buyer_profile.actions.save")}
                  </button>
                  <button
                    type='button'
                    onClick={() => setIsEditing(false)}
                    className='bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition'
                  >
                    {t("buyer_profile.actions.cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <div className='space-y-4 transition-all duration-300 ease-in-out'>
                {[
                  "name",
                  "email",
                  "address",
                  "phone",
                  "crNumber",
                  "vatNumber",
                ].map((field) => (
                  <p key={field}>
                    <span className='font-medium text-gray-700'>
                      {t(`buyer_profile.fields.${field}`)}:
                    </span>{" "}
                    {profile[field]}
                  </p>
                ))}

                <div>
                  <span className='font-medium text-gray-700'>
                    {t("buyer_profile.fields.logo")}:
                  </span>{" "}
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt={t("buyer_profile.fields.current_logo")}
                      className='w-32 h-32 mt-2 rounded object-cover'
                    />
                  ) : (
                    <p className='text-gray-500'>
                      {t("buyer_profile.fields.no_logo_uploaded")}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className='mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-emerald-700 transition'
                >
                  {t("buyer_profile.actions.edit")}
                </button>
              </div>
            )}
          </>
        ) : (
          <p>{t("buyer_profile.messages.no_profile_data_available")}</p>
        )}
      </div>
    </div>
  );
};

export default BuyerProfile;
