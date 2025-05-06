"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatMiniProductSnapshot from "@/components/chat/ChatMiniProductSnapshot";
import { toast } from "sonner";

export default function ProductDetailsChatClient({ chatId }) {
  const { currentUser } = useAuth();
  const [chatMeta, setChatMeta] = useState(null);
  const [miniProduct, setMiniProduct] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notification, setNotification] = useState(null);

  // 1️⃣ Load & subscribe to productDetailsChats/{chatId}
  useEffect(() => {
    if (!chatId || !currentUser) return;
    const chatRef = doc(db, "productDetailsChats", chatId);

    getDoc(chatRef)
      .then((snap) => {
        if (!snap.exists()) {
          setNotification("Chat not found.");
        } else {
          const data = snap.data();
          setChatMeta(data);
          setMessages(data.messages || []);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load chat.");
      });

    const unsub = onSnapshot(
      chatRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setChatMeta(data);
          setMessages(data.messages || []);
        }
      },
      (err) => {
        console.error(err);
        toast.error("Chat connection error.");
      }
    );

    return () => unsub();
  }, [chatId, currentUser]);

  // 2️⃣ Load the snapshot from miniProductsDetails/{chatId}
  useEffect(() => {
    if (!chatId) return;
    const miniRef = doc(db, "miniProductsDetails", chatId);

    getDoc(miniRef)
      .then((snap) => {
        if (snap.exists()) {
          setMiniProduct(snap.data());
        } else {
          setNotification("Product snapshot not found.");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load product info.");
      });
  }, [chatId]);

  // 3️⃣ Show loading until both meta + miniProduct are ready
  if (!chatMeta || !miniProduct) {
    return <p className='p-6 text-center text-gray-500'>Loading…</p>;
  }

  const isBuyer = currentUser.uid === chatMeta.buyerId;
  const otherLabel = isBuyer ? "Supplier" : "Buyer";

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      {/* Sidebar: mini snapshot */}
      <aside className='col-span-1 border rounded p-4 bg-white space-y-4'>
        <h2 className='text-lg font-semibold text-[#2c6449]'>
          Product Details
        </h2>
        <ChatMiniProductSnapshot data={miniProduct} />
      </aside>

      {/* Chat */}
      <section className='col-span-2 flex flex-col'>
        {notification && (
          <div className='mb-2 p-2 bg-red-100 text-red-700 text-sm rounded'>
            {notification}
          </div>
        )}
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          Chat with {otherLabel}
        </h2>
        <ChatMessages chatId={chatId} chatMeta={chatMeta} messages={messages} />
      </section>
    </div>
  );
}
