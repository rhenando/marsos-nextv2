import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

const SupplierMessages = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchChats = async () => {
      try {
        const allChats = [];

        const chatSources = [
          {
            collectionName: "rfqChats",
            label: "RFQ Inquiry",
            buildPath: (id) => `/rfq-chat/${id}`,
          },
          {
            collectionName: "productChats",
            label: "Product Inquiry",
            buildPath: (id) => `/product-chat/${id}`,
          },
          {
            collectionName: "cartChats",
            label: "Cart Inquiry",
            buildPath: (id) => `/cart-chat/${id}`,
          },
          {
            collectionName: "orderChats",
            label: "Order Inquiry",
            buildPath: async (id, data) => {
              let billNumber = data.billNumber || null;
              let totalAmount = null;
              let orderStatus = null;

              if (billNumber) {
                const orderSnap = await getDoc(doc(db, "orders", billNumber));
                if (orderSnap.exists()) {
                  const orderData = orderSnap.data();
                  totalAmount = orderData.totalAmount || null;
                  orderStatus = orderData.orderStatus || null;
                }
              }

              const encoded = encodeURIComponent(
                JSON.stringify({
                  billNumber: billNumber || null,
                  totalAmount,
                  orderStatus,
                })
              );
              return `/order-chat/${id}?extraData=${encoded}`;
            },
          },
        ];

        for (const source of chatSources) {
          const q = query(
            collection(db, source.collectionName),
            where("supplierId", "==", currentUser.uid)
          );

          const snap = await getDocs(q);

          for (const docSnap of snap.docs) {
            const data = docSnap.data();

            let buyerName = "Unknown Buyer";
            if (data.buyerId) {
              const buyerSnap = await getDoc(doc(db, "users", data.buyerId));
              if (buyerSnap.exists()) {
                buyerName = buyerSnap.data().name || "Unknown Buyer";
              }
            }

            const path =
              typeof source.buildPath === "function"
                ? await source.buildPath(docSnap.id, data)
                : source.buildPath;

            allChats.push({
              id: docSnap.id,
              buyerName,
              concernType: source.label,
              chatPath: path,
            });
          }
        }

        setChats(allChats);
      } catch (error) {
        console.error("❌ Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [currentUser]);

  if (loading)
    return <p className='text-center mt-3 small'>Loading messages...</p>;

  return (
    <div className='container my-3'>
      <h5 className='mb-2'>Messages</h5>

      {chats.length === 0 ? (
        <p className='text-muted text-center small'>No messages yet.</p>
      ) : (
        <div className='table-responsive'>
          <table className='table table-sm table-striped table-hover'>
            <thead className='table-dark small'>
              <tr>
                <th>Buyer</th>
                <th>Concern Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {chats.map((chat) => (
                <tr key={chat.id}>
                  <td className='small'>{chat.buyerName}</td>
                  <td className='small'>{chat.concernType}</td>
                  <td>
                    <Link
                      to={chat.chatPath}
                      className='btn btn-sm btn-success'
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SupplierMessages;
