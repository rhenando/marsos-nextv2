import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config"; // Ensure correct Firebase config import
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { useAuth } from "../../context/AuthContext"; // Ensure correct auth context

const SupplierRFQs = () => {
  const auth = getAuth(); // Get current authenticated user
  const { userData } = useAuth(); // Get userData from AuthContext
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("No authenticated user found.");
      setLoading(false);
      return;
    }

    console.log("Authenticated User ID:", currentUser.uid);

    const supplierId = userData?.supplierId || currentUser.uid; // Use supplierId from Firestore or Auth UID

    if (!supplierId) {
      console.log("No supplier ID found. Skipping RFQ fetch.");
      setLoading(false);
      return;
    }

    console.log("Fetching RFQs for supplierId:", supplierId);

    const fetchRFQs = async () => {
      try {
        const rfqsRef = collection(db, "rfqs");
        const q = query(rfqsRef, where("supplierId", "==", supplierId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("No RFQs found for this supplier.");
        }

        const rfqList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("RFQs found:", rfqList);
        setRfqs(rfqList);
      } catch (error) {
        console.error("Error fetching RFQs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRFQs();
  }, [auth.currentUser, userData]);

  return (
    <div>
      <h4>Manage RFQs</h4>
      {loading ? (
        <p>Loading RFQs...</p>
      ) : rfqs.length > 0 ? (
        <ul>
          {rfqs.map((rfq) => (
            <li key={rfq.id}>
              <strong>{rfq.supplierName}</strong> - {rfq.category} -{" "}
              {rfq.shipping}
            </li>
          ))}
        </ul>
      ) : (
        <p>No RFQs found for your account.</p>
      )}
    </div>
  );
};

export default SupplierRFQs;
