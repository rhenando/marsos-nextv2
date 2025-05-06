// components/chat/RfqChatClient.jsx
"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import ChatMessages from "@/components/chat/ChatMessages";

export default function RfqChatClient({ chatId }) {
  const { currentUser } = useAuth();
  const [chatMeta, setChatMeta] = useState(null);
  const [rfqList, setRfqList] = useState([]);

  // Load chat metadata
  useEffect(() => {
    if (!chatId) return;
    getDoc(doc(db, "rfqChats", chatId)).then((snap) => {
      if (snap.exists()) {
        setChatMeta({
          ...snap.data(),
          createdAt: snap.data().createdAt?.toDate()?.toISOString() || null,
        });
      }
    });
  }, [chatId]);

  // Subscribe to all RFQs matching buyerId & supplierId
  useEffect(() => {
    if (!chatMeta?.buyerId || !chatMeta?.supplierId) return;

    const q = query(
      collection(db, "rfqs"),
      where("buyerId", "==", chatMeta.buyerId),
      where("supplierId", "==", chatMeta.supplierId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setRfqList(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          timestamp: d.data().timestamp?.toDate?.().toISOString() || "",
        }))
      );
    });

    return () => unsub();
  }, [chatMeta]);

  if (!chatMeta) return null;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      {/* RFQ Details Pane */}
      <aside className='col-span-1 border rounded p-4 bg-white space-y-4'>
        <h2 className='text-lg font-semibold text-[#2c6449]'>RFQ Details</h2>
        {rfqList.length === 0 ? (
          <p className='text-sm text-red-500'>No RFQ records found.</p>
        ) : (
          rfqList.map((item) => (
            <div key={item.id} className='border-b pb-2'>
              <p>
                <strong>Details:</strong> {item.productDetails}
              </p>
              <p>
                <strong>Category:</strong> {item.category}
              </p>
              <p>
                <strong>Subcategory:</strong> {item.subcategory}
              </p>
              <p>
                <strong>Size:</strong> {item.size}
              </p>
              <p>
                <strong>Color:</strong> {item.color}
              </p>
              <p>
                <strong>Shipping To:</strong> {item.shipping}
              </p>
              {item.fileURL && (
                <p>
                  <a
                    href={item.fileURL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 underline text-sm'
                  >
                    Download Attachment
                  </a>
                </p>
              )}
              <p className='text-xs text-gray-500'>
                Sent: {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </aside>

      {/* Chat Pane */}
      <section className='col-span-2 flex flex-col'>
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          Chat with Supplier
        </h2>
        <ChatMessages chatId={chatId} chatMeta={chatMeta} />
      </section>
    </div>
  );
}
