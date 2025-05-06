"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, SendHorizontal } from "lucide-react";

const ChatMessages = ({ chatId, chatMeta }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef(null);
  const [buyerName, setBuyerName] = useState("");

  // ✅ Fetch buyer's name only
  useEffect(() => {
    const getBuyerName = async () => {
      if (!chatMeta?.buyerId) return;

      try {
        const userRef = doc(db, "users", chatMeta.buyerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setBuyerName(
            data.name || data.fullName || data.displayName || "Buyer"
          );
        } else {
          setBuyerName("Buyer");
        }
      } catch (error) {
        console.error("Error fetching buyer name:", error);
        setBuyerName("Buyer");
      }
    };

    getBuyerName();
  }, [chatMeta?.buyerId]);

  // ✅ Listen to messages in real time
  useEffect(() => {
    const messagesRef = collection(db, "cartChats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 📨 Send new message
  const sendMessage = async () => {
    if (!newMsg.trim() || !currentUser) return;

    const senderRole =
      currentUser.uid === chatMeta.buyerId ? "buyer" : "supplier";
    const senderName =
      senderRole === "buyer"
        ? buyerName
        : currentUser.displayName || "Supplier";

    await addDoc(collection(db, "cartChats", chatId, "messages"), {
      senderId: currentUser.uid,
      senderRole,
      senderName,
      text: newMsg,
      createdAt: new Date(),
    });

    setNewMsg("");
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Chat Display */}
      <div className='flex-1 overflow-y-auto space-y-2 p-4 border rounded bg-gray-50'>
        {messages.map((msg) => {
          const isSender = msg.senderId === currentUser.uid;
          const displayName =
            msg.senderRole === "buyer"
              ? buyerName
              : msg.senderName || "Supplier";

          return (
            <div
              key={msg.id}
              className={`relative max-w-[75%] p-3 rounded-xl text-sm leading-snug ${
                isSender
                  ? "ml-auto bg-[#dcf8c6] text-right rounded-br-none"
                  : "mr-auto bg-white text-left rounded-bl-none border"
              }`}
            >
              <div className='text-xs text-gray-500 mb-1 font-medium'>
                {msg.senderRole === "buyer" ? "🧍 Buyer" : "🏪 Supplier"} •{" "}
                {displayName}
              </div>

              <p className='whitespace-pre-wrap text-gray-800'>{msg.text}</p>

              <span className='text-[10px] text-gray-500 mt-1 block'>
                {new Date(
                  msg.createdAt?.seconds * 1000 || Date.now()
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {/* Chat Tail Bubble */}
              <div
                className={`absolute w-0 h-0 border-t-8 border-b-8 top-2 ${
                  isSender
                    ? "right-[-8px] border-l-[8px] border-l-[#dcf8c6] border-t-transparent border-b-transparent"
                    : "left-[-8px] border-r-[8px] border-r-white border-t-transparent border-b-transparent"
                }`}
              ></div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className='flex gap-2 mt-3'
      >
        {/* Attachment icon with dropdown */}
        <div className='relative group'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='text-gray-500 hover:text-gray-800'
          >
            <Paperclip size={20} />
          </Button>
          <div className='absolute bottom-10 left-0 z-10 hidden group-hover:block bg-white border rounded shadow text-sm text-gray-800 w-40'>
            <ul className='py-2'>
              <li className='px-3 py-1 hover:bg-gray-100 cursor-pointer'>
                📷 Photos & videos
              </li>
              <li className='px-3 py-1 hover:bg-gray-100 cursor-pointer'>
                📸 Camera
              </li>
              <li className='px-3 py-1 hover:bg-gray-100 cursor-pointer'>
                📄 Document
              </li>
              <li className='px-3 py-1 hover:bg-gray-100 cursor-pointer'>
                👤 Contact
              </li>
              <li className='px-3 py-1 hover:bg-gray-100 cursor-pointer'>
                📊 Poll
              </li>
              <li className='px-3 py-1 hover:bg-gray-100 cursor-pointer'>
                ✏️ Drawing
              </li>
            </ul>
          </div>
        </div>

        <Input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder='Type your message...'
          className='flex-1'
        />

        <Button type='submit' className='bg-[#2c6449] text-white'>
          <SendHorizontal size={16} />
        </Button>
      </form>
    </div>
  );
};

export default ChatMessages;
