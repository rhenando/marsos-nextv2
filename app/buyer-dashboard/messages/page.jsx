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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const filteredChats = chats.filter((chat) => {
    const matchesName = chat.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "All" || chat.concernType === selectedType;
    return matchesName && matchesType;
  });

  const badgeColorMap = {
    "RFQ Inquiry": "yellow",
    "Product Inquiry": "blue",
    "Cart Inquiry": "purple",
    "Order Inquiry": "green",
  };

  if (loading || !userRole) {
    return (
      <p className='text-center mt-6 text-sm text-muted-foreground'>
        Loading messages...
      </p>
    );
  }

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <h2 className='text-2xl font-semibold mb-6'>Messages</h2>

      {/* Filters */}
      <div className='flex flex-wrap items-center gap-4 mb-6'>
        <Input
          placeholder='Search by name...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-60'
        />

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Select Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All Types</SelectItem>
            {Object.keys(badgeColorMap).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <ScrollArea className='rounded border'>
        <table className='min-w-full text-sm'>
          <thead className='bg-[#2c6449] text-white'>
            <tr>
              <th className='px-4 py-2 text-left'>
                {userRole === "supplier" ? "Buyer" : "Supplier"}
              </th>
              <th className='px-4 py-2 text-left'>Concern Type</th>
              <th className='px-4 py-2 text-left'>Last Updated</th>
              <th className='px-4 py-2 text-left'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChats.map((chat) => (
              <tr
                key={chat.id}
                className={chat.unread ? "bg-yellow-50" : "bg-white"}
              >
                <td className='px-4 py-2'>{chat.name}</td>
                <td className='px-4 py-2'>
                  <Badge
                    variant='outline'
                    className={`text-${badgeColorMap[chat.concernType]}-800`}
                  >
                    {chat.concernType}
                  </Badge>
                </td>
                <td className='px-4 py-2'>
                  {chat.lastUpdated.toLocaleString()}
                </td>
                <td className='px-4 py-2 flex gap-2'>
                  <Link
                    href={chat.chatPath}
                    target='_blank'
                    className='bg-[#2c6449] hover:bg-[#24523b] text-white text-xs px-3 py-2 rounded'
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
      </ScrollArea>

      {filteredChats.length === 0 && (
        <p className='text-muted-foreground mt-4 text-sm text-center'>
          No messages found.
        </p>
      )}
    </div>
  );
};

export default UserMessages;
