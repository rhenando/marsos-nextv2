import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

const ManageProfiles = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    companyDescription: "",
    address: "",
    crNumber: "",
    vatNumber: "",
    logoUrl: "",
    bankDetails: [],
  });
  const [uploading, setUploading] = useState(false);

  const storage = getStorage();
  const { t } = useTranslation(); // Use i18n translation hook

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setError(t("manage_profiles.errors.no_user_logged_in"));
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
            role: data.role || "",
            companyDescription: data.companyDescription || "",
            address: data.address || "",
            crNumber: data.crNumber || "",
            vatNumber: data.vatNumber || "",
            logoUrl: data.logoUrl || "",
            bankDetails: Array.isArray(data.bankDetails)
              ? data.bankDetails
              : [],
            bankDetailFiles: Array.isArray(data.bankDetailFiles)
              ? data.bankDetailFiles
              : [],
          });
        } else {
          setError(t("manage_profiles.errors.no_profile_found"));
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(t("manage_profiles.errors.failed_to_load_profile"));
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBankFileUpload = (file, index) => {
    if (!file) return;

    setUploading(true);
    const storageRef = ref(
      storage,
      `bank_details/${currentUser.uid}/${file.name}`
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      () => {}, // Optional: Handle progress
      (error) => {
        console.error("Error uploading file:", error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // ✅ Update specific bank details with the file URL
        const updatedBankDetails = [...formData.bankDetails];
        updatedBankDetails[index] = {
          ...updatedBankDetails[index],
          fileUrl: downloadURL,
        };

        setFormData({ ...formData, bankDetails: updatedBankDetails });
        setUploading(false);
        alert(t("manage_profiles.messages.file_uploaded_success"));
      }
    );
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleBankInputChange = (e, index, field) => {
    const updatedBankDetails = [...formData.bankDetails];
    updatedBankDetails[index][field] = e.target.value;
    setFormData({ ...formData, bankDetails: updatedBankDetails });
  };

  const handleAddBankDetail = () => {
    setFormData({
      ...formData,
      bankDetails: [
        ...formData.bankDetails,
        { bankName: "", accountName: "", accountNumber: "" },
      ],
    });
  };

  const handleRemoveBankDetail = (index) => {
    const updatedBankDetails = [...formData.bankDetails];
    updatedBankDetails.splice(index, 1);
    setFormData({ ...formData, bankDetails: updatedBankDetails });
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `logos/${currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      () => {}, // Optional: Handle progress
      (error) => {
        console.error("Error uploading file:", error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData({ ...formData, logoUrl: downloadURL });
        setUploading(false);
        alert(t("manage_profiles.messages.logo_uploaded_success"));
      }
    );
  };

  const handleSave = async () => {
    if (!currentUser) {
      setError(t("manage_profiles.errors.no_user_logged_in"));
      return;
    }

    try {
      const userDoc = doc(db, "users", currentUser.uid);
      await updateDoc(userDoc, {
        ...formData,
        bankDetails: formData.bankDetails || [], // ✅ Ensure bankDetails is always saved as an array
      });

      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      alert(t("manage_profiles.messages.profile_updated_success"));
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(t("manage_profiles.errors.failed_to_update_profile"));
    }
  };

  if (loading) {
    return <p>{t("manage_profiles.messages.loading")}</p>;
  }

  if (error) {
    return <p className='text-danger'>{error}</p>;
  }

  return (
    <div>
      <h4 className='text-success fw-bold'>{t("manage_profiles.title")}</h4>
      {profile ? (
        <div>
          {isEditing ? (
            <form>
              <div>
                <label>
                  <strong>{t("manage_profiles.fields.name")}:</strong>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  <strong>{t("manage_profiles.fields.email")}:</strong>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  <strong>{t("manage_profiles.fields.role")}:</strong>
                  <input
                    type='text'
                    name='role'
                    value={formData.role}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  <strong>{t("manage_profiles.fields.address")}:</strong>
                  <input
                    type='text'
                    name='address'
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  <strong>{t("manage_profiles.fields.crNumber")}:</strong>
                  <input
                    type='text'
                    name='crNumber'
                    value={formData.crNumber}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  <strong>{t("manage_profiles.fields.vatNumber")}:</strong>
                  <input
                    type='text'
                    name='vatNumber'
                    value={formData.vatNumber}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <div>
                <h5 className='fw-bold mt-3'>Bank Details</h5>
                <table
                  border='1'
                  cellPadding='5'
                  cellSpacing='0'
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th>Bank Name</th>
                      <th>Account Name</th>
                      <th>Account Number</th>
                      <th>Bank Detail File (PDF)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.bankDetails.map((bank, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type='text'
                            value={bank.bankName}
                            onChange={(e) =>
                              handleBankInputChange(e, index, "bankName")
                            }
                          />
                        </td>
                        <td>
                          <input
                            type='text'
                            value={bank.accountName}
                            onChange={(e) =>
                              handleBankInputChange(e, index, "accountName")
                            }
                          />
                        </td>
                        <td>
                          <input
                            type='text'
                            value={bank.accountNumber}
                            onChange={(e) =>
                              handleBankInputChange(e, index, "accountNumber")
                            }
                          />
                        </td>
                        <td>
                          {/* PDF Upload Input */}
                          <input
                            type='file'
                            accept='application/pdf'
                            onChange={(e) =>
                              handleBankFileUpload(e.target.files[0], index)
                            }
                          />
                          {bank.fileUrl && (
                            <a
                              href={bank.fileUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              View
                            </a>
                          )}
                        </td>
                        <td>
                          <button
                            type='button'
                            onClick={() => handleRemoveBankDetail(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type='button' onClick={handleAddBankDetail}>
                  Add Bank Detail
                </button>
                {uploading && (
                  <p>{t("manage_profiles.actions.uploading_file")}</p>
                )}
              </div>

              <div>
                <label>
                  <strong>
                    {t("manage_profiles.fields.company_description")}:
                  </strong>
                  <textarea
                    name='companyDescription'
                    value={formData.companyDescription}
                    onChange={handleInputChange}
                    rows='4'
                    style={{ width: "100%" }}
                  />
                </label>
              </div>
              <div>
                <label>
                  <strong>{t("manage_profiles.fields.logo")}:</strong>
                  {formData.logoUrl && (
                    <img
                      src={formData.logoUrl}
                      alt={t("manage_profiles.fields.current_logo")}
                      style={{
                        maxWidth: "150px",
                        maxHeight: "150px",
                        display: "block",
                        marginBottom: "10px",
                      }}
                    />
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  {uploading && (
                    <p>{t("manage_profiles.actions.uploading_logo")}</p>
                  )}
                </label>
              </div>
              <button type='button' onClick={handleSave} disabled={uploading}>
                {t("manage_profiles.actions.save")}
              </button>
              <button type='button' onClick={handleEditToggle}>
                {t("manage_profiles.actions.cancel")}
              </button>
            </form>
          ) : (
            <div>
              <p>
                <strong>{t("manage_profiles.fields.name")}:</strong>{" "}
                {profile.name}
              </p>
              <p>
                <strong>{t("manage_profiles.fields.email")}:</strong>{" "}
                {profile.email}
              </p>
              <p>
                <strong>{t("manage_profiles.fields.role")}:</strong>{" "}
                {profile.role}
              </p>
              <p>
                <strong>{t("manage_profiles.fields.address")}:</strong>{" "}
                {profile.address}
              </p>
              <p>
                <strong>{t("manage_profiles.fields.crNumber")}:</strong>{" "}
                {profile.crNumber}
              </p>
              <p>
                <strong>{t("manage_profiles.fields.vatNumber")}:</strong>{" "}
                {profile.vatNumber}
              </p>

              {/* ✅ Add Bank Details Section Here */}
              <h5 className='fw-bold mt-3'>Bank Details</h5>
              {profile.bankDetails?.length > 0 ? (
                <table
                  border='1'
                  cellPadding='5'
                  cellSpacing='0'
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th>Bank Name</th>
                      <th>Account Name</th>
                      <th>Account Number</th>
                      <th>Bank Detail File (PDF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.bankDetails.map((bank, index) => (
                      <tr key={index}>
                        <td>{bank.bankName}</td>
                        <td>{bank.accountName}</td>
                        <td>{bank.accountNumber}</td>
                        <td>
                          {bank.fileUrl ? (
                            <a
                              href={bank.fileUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              View PDF
                            </a>
                          ) : (
                            "No file uploaded"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No bank details added yet.</p>
              )}

              <p>
                <strong>
                  {t("manage_profiles.fields.company_description")}:
                </strong>{" "}
                {profile.companyDescription}
              </p>

              <p>
                <strong>{t("manage_profiles.fields.logo")}:</strong>
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={t("manage_profiles.fields.current_logo")}
                    style={{ maxWidth: "150px", maxHeight: "150px" }}
                  />
                ) : (
                  t("manage_profiles.fields.no_logo_uploaded")
                )}
              </p>

              <button onClick={handleEditToggle}>
                {t("manage_profiles.actions.edit")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p>{t("manage_profiles.messages.no_profile_data_available")}</p>
      )}
    </div>
  );
};

export default ManageProfiles;
