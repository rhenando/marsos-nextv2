"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const ManageTermsPage = () => {
  const { userData } = useAuth();
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

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
        setMessage("Failed to fetch terms.");
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

      setMessage("✅ Terms and Conditions saved successfully.");
    } catch (error) {
      console.error("Error saving terms:", error);
      setMessage("❌ Error saving terms.");
    }
  };

  return (
    <div className='w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-6'>
      <div className='bg-white p-4 sm:p-6 rounded-xl shadow-md'>
        <h2 className='text-2xl font-semibold mb-4'>
          Manage Terms & Conditions
        </h2>

        {loading ? (
          <div className='flex items-center space-x-2'>
            <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            <span>Loading terms...</span>
          </div>
        ) : (
          <>
            <Textarea
              className='w-full mb-4 min-h-[200px]'
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder='Write your terms and conditions here...'
            />

            <Button
              onClick={handleSave}
              className='w-full sm:w-auto bg-primary text-white'
            >
              Save Terms and Conditions
            </Button>

            {message && (
              <Alert className='mt-4'>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageTermsPage;
