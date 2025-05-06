// components/chat/ProductChatClient.jsx
"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import ChatMessages from "@/components/chat/ChatMessages";
import Currency from "@/components/global/CurrencySymbol";
import { Input } from "@/components/ui/input";
import MiniProductDetails from "@/components/chat/MiniProductDetails"; // create this to render mini snapshot
import { toast } from "sonner";

export default function ProductChatClient({ chatId }) {
  const { currentUser } = useAuth();
  const [chatMeta, setChatMeta] = useState(null);
  const [miniProduct, setMiniProduct] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notification, setNotification] = useState(null);

  // 1️⃣ Fetch chatMeta and subscribe to updates
  useEffect(() => {
    if (!chatId || !currentUser) return;
    const chatRef = doc(db, "productChats", chatId);

    // First load
    getDoc(chatRef)
      .then((snap) => {
        if (!snap.exists()) {
          setNotification("Chat not found.");
        } else {
          setChatMeta(snap.data());
          setMessages(snap.data().messages || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load chat:", err);
        toast.error("Could not load chat.");
      });

    // Subscribe for real‐time updates
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
        console.error("Chat subscription error:", err);
        toast.error("Chat connection error.");
      }
    );

    return () => unsub();
  }, [chatId, currentUser]);

  // 2️⃣ Fetch mini‐product snapshot
  useEffect(() => {
    if (!chatId) return;
    const miniRef = doc(db, "miniProductsData", chatId);

    getDoc(miniRef)
      .then((snap) => {
        if (snap.exists()) {
          setMiniProduct(snap.data());
        } else {
          setNotification("Product snapshot not found.");
        }
      })
      .catch((err) => {
        console.error("Failed to load product snapshot:", err);
        toast.error("Could not load product info.");
      });
  }, [chatId]);

  // If still loading either
  if (!chatMeta || !miniProduct) {
    return <p className='p-6 text-center text-gray-500'>Loading…</p>;
  }

  const isBuyer = currentUser.uid === chatMeta.buyerId;
  const isSupplier = currentUser.uid === chatMeta.supplierId;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      {/* ───────────── SIDEBAR: Mini Product Snapshot ───────────── */}
      <aside className='col-span-1 border rounded p-4 bg-white space-y-4'>
        <h2 className='text-lg font-semibold text-[#2c6449]'>
          Product Details
        </h2>
        <MiniProductDetails data={miniProduct} />
      </aside>

      {/* ───────────── CHAT: Messages ───────────── */}
      <section className='col-span-2 flex flex-col'>
        {notification && (
          <div className='mb-2 p-2 bg-red-100 text-red-700 text-sm rounded'>
            {notification}
          </div>
        )}
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          Chat with {isBuyer ? "Supplier" : "Buyer"}
        </h2>
        <ChatMessages chatId={chatId} chatMeta={chatMeta} messages={messages} />
      </section>
    </div>
  );
}
