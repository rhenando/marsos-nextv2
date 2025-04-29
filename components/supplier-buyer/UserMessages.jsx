"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const UserMessages = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserRoleAndChats = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const role = userSnap.data().role;
          setUserRole(role);

          const chatSources = [
            {
              collectionName: "rfqChats",
              label: "RFQ Inquiry",
              pathBuilder: (id) => `/rfq-chat/${id}`,
              filterKey: role === "supplier" ? "supplierId" : "buyerId",
            },
            {
              collectionName: "productChats",
              label: "Product Inquiry",
              pathBuilder: (id) => `/product-chat/${id}`,
              filterKey: role === "supplier" ? "supplierId" : "buyerId",
            },
            {
              collectionName: "cartChats",
              label: "Cart Inquiry",
              pathBuilder: (id) => `/cart-chat/${id}`,
              filterKey: role === "supplier" ? "supplierId" : "buyerId",
            },
            {
              collectionName: "orderChats",
              label: "Order Inquiry",
              pathBuilder: async (id, data) => {
                const billNumber = data.billNumber || null;
                let totalAmount = null;
                let orderStatus = null;

                if (billNumber) {
                  const orderSnap = await getDoc(doc(db, "orders", billNumber));
                  if (orderSnap.exists()) {
                    const orderData = orderSnap.data();
                    totalAmount = orderData.totalAmount;
                    orderStatus = orderData.orderStatus;
                  }
                }

                const extraData = encodeURIComponent(
                  JSON.stringify({ billNumber, totalAmount, orderStatus })
                );
                return `/order-chat/${id}?extraData=${extraData}`;
              },
              filterKey: role === "supplier" ? "supplierId" : "buyerId",
            },
          ];

          const unsubscribes = [];

          for (const source of chatSources) {
            const q = query(
              collection(db, source.collectionName),
              where(source.filterKey, "==", currentUser.uid)
            );

            const unsubscribe = onSnapshot(q, async (snap) => {
              const updatedChats = [];

              for (const docSnap of snap.docs) {
                const data = docSnap.data();
                const otherId =
                  role === "supplier" ? data.buyerId : data.supplierId;

                let otherName = "Unknown";
                if (otherId) {
                  const userSnap = await getDoc(doc(db, "users", otherId));
                  if (userSnap.exists()) {
                    otherName = userSnap.data().name || "Unknown";
                  }
                }

                const path =
                  typeof source.pathBuilder === "function"
                    ? await source.pathBuilder(docSnap.id, data)
                    : source.pathBuilder;

                const readBy = data.readBy || [];
                const isRead = readBy.includes(currentUser.uid);

                updatedChats.push({
                  id: docSnap.id,
                  name: otherName,
                  concernType: source.label,
                  chatPath: path,
                  lastUpdated: data.lastUpdated?.toDate() || new Date(0),
                  unread: !isRead,
                  collectionName: source.collectionName,
                });
              }

              setChats((prev) => {
                const filtered = prev.filter(
                  (c) => c.concernType !== source.label
                );
                return [...filtered, ...updatedChats].sort(
                  (a, b) => b.lastUpdated - a.lastUpdated
                );
              });
            });

            unsubscribes.push(unsubscribe);
          }

          return () => {
            unsubscribes.forEach((unsub) => unsub());
          };
        }
      } catch (err) {
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoleAndChats();
  }, [currentUser]);

  const handleMarkAsRead = async (chatId, collectionName) => {
    try {
      const chatRef = doc(db, collectionName, chatId);
      await updateDoc(chatRef, {
        readBy: arrayUnion(currentUser.uid),
      });

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, unread: false } : chat
        )
      );
    } catch (err) {
      console.error("❌ Failed to mark as read:", err);
    }
  };

  const getBadge = (type) => {
    const base =
      "inline-flex items-center text-xs font-medium px-2 py-1 rounded-full";

    const map = {
      "RFQ Inquiry": "bg-yellow-100 text-yellow-800",
      "Product Inquiry": "bg-blue-100 text-blue-800",
      "Cart Inquiry": "bg-purple-100 text-purple-800",
      "Order Inquiry": "bg-green-100 text-green-800",
    };

    return (
      <span className={`${base} ${map[type] || "bg-gray-200 text-gray-700"}`}>
        {type}
      </span>
    );
  };

  const filteredChats = chats.filter((chat) => {
    const matchesName = chat.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "All" || chat.concernType === selectedType;
    return matchesName && matchesType;
  });

  if (loading || !userRole) {
    return (
      <p className='text-center mt-6 text-sm text-gray-600'>
        Loading messages...
      </p>
    );
  }

  return (
    <div className='max-w-6xl mx-auto p-4'>
      <h2 className='text-xl font-semibold mb-4'>Your Messages</h2>

      {/* Filters */}
      <div className='flex flex-wrap gap-4 items-center mb-6'>
        <Input
          type='text'
          placeholder='Search by name...'
          className='w-60'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectItem value='All'>All Types</SelectItem>
          <SelectItem value='RFQ Inquiry'>RFQ Inquiry</SelectItem>
          <SelectItem value='Product Inquiry'>Product Inquiry</SelectItem>
          <SelectItem value='Cart Inquiry'>Cart Inquiry</SelectItem>
          <SelectItem value='Order Inquiry'>Order Inquiry</SelectItem>
        </Select>
      </div>

      {/* Table */}
      {filteredChats.length === 0 ? (
        <p className='text-gray-500 text-sm text-center'>No messages found.</p>
      ) : (
        <div className='overflow-x-auto border rounded'>
          <table className='min-w-full text-sm'>
            <thead className='bg-[#2c6449] text-white text-left'>
              <tr>
                <th className='px-4 py-2'>
                  {userRole === "supplier" ? "Buyer" : "Supplier"}
                </th>
                <th className='px-4 py-2'>Concern Type</th>
                <th className='px-4 py-2'>Last Updated</th>
                <th className='px-4 py-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChats.map((chat) => (
                <tr
                  key={chat.id}
                  className={chat.unread ? "bg-yellow-50" : "bg-white"}
                >
                  <td className='px-4 py-2'>{chat.name}</td>
                  <td className='px-4 py-2'>{getBadge(chat.concernType)}</td>
                  <td className='px-4 py-2 whitespace-nowrap'>
                    {chat.lastUpdated.toLocaleString()}
                  </td>
                  <td className='px-4 py-2 flex gap-2'>
                    <Link
                      href={chat.chatPath}
                      target='_blank'
                      className='text-white bg-[#2c6449] px-3 py-1 rounded text-xs hover:bg-[#24523b]'
                    >
                      Open
                    </Link>

                    {chat.unread && (
                      <Button
                        size='sm'
                        variant='outline'
                        className='text-xs border-yellow-400 text-yellow-800 hover:bg-yellow-100'
                        onClick={() =>
                          handleMarkAsRead(chat.id, chat.collectionName)
                        }
                      >
                        Mark as Read
                      </Button>
                    )}
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

export default UserMessages;
