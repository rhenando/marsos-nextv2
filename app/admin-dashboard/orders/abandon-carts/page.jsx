"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const AbandonedCartsPage = () => {
  const { userData } = useAuth();
  const router = useRouter();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData || userData.role !== "admin") {
      router.push("/admin-login");
    }
  }, [userData, router]);

  useEffect(() => {
    const fetchAbandonedCarts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "carts"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filtered = data.filter((cart) => cart.items?.length > 0);
        setCarts(filtered);
      } catch (error) {
        toast.error("Failed to fetch abandoned carts.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAbandonedCarts();
  }, []);

  return (
    <div className='max-w-5xl mx-auto px-4 py-6'>
      <h2 className='text-xl font-semibold text-[#2c6449] mb-4'>
        Abandoned Carts
      </h2>

      {loading ? (
        <p>Loading abandoned carts...</p>
      ) : carts.length === 0 ? (
        <p>No abandoned carts found.</p>
      ) : (
        <div className='space-y-4'>
          {carts.map((cart) => (
            <div
              key={cart.id}
              className='border rounded-md p-4 bg-white shadow-sm'
            >
              <h4 className='text-sm font-medium text-gray-800 mb-1'>
                Buyer ID: <span className='text-[#2c6449]'>{cart.buyerId}</span>
              </h4>
              <p className='text-xs text-gray-500 mb-2'>
                Last updated{" "}
                {cart.updatedAt?.toDate
                  ? formatDistanceToNow(cart.updatedAt.toDate(), {
                      addSuffix: true,
                    })
                  : "unknown"}
              </p>

              <ul className='list-disc ml-4 text-sm text-gray-700'>
                {cart.items?.map((item, index) => (
                  <li key={index}>
                    {item.name} — Qty: {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AbandonedCartsPage;
