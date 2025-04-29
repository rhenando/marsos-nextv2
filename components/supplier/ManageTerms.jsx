import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const ManageTerms = () => {
  const { userData } = useAuth();
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const docRef = doc(db, "terms_and_conditions", userData.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTerms(docSnap.data().content);
        } else {
          setTerms("");
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.uid) {
      fetchTerms();
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      const docRef = doc(db, "terms_and_conditions", userData.uid);
      await setDoc(docRef, {
        content: terms,
        supplierId: userData.uid,
        supplierName: userData.name || "",
      });

      setMessage("Terms and Conditions saved successfully.");
    } catch (error) {
      console.error("Error saving terms:", error);
      setMessage("Error saving terms.");
    }
  };

  return (
    <div>
      <h4>Manage Terms & Conditions</h4>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={10}
            style={{ width: "100%", padding: "10px" }}
          />
          <button
            onClick={handleSave}
            style={{
              marginTop: "10px",
              backgroundColor: "#2c6449",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Save Terms and Conditions
          </button>
          {message && <p style={{ marginTop: "10px" }}>{message}</p>}
        </>
      )}
    </div>
  );
};

export default ManageTerms;
