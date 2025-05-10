"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const SupplierMessages = () => {
  const { user: currentUser, loading: authLoading } = useSelector(
    (state) => state.auth
  );
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
              const billNumber = data.billNumber || null;
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
                JSON.stringify({ billNumber, totalAmount, orderStatus })
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

  if (authLoading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Loader2 className='animate-spin' />
      </div>
    );
  }
  if (currentUser?.role !== "supplier") {
    return <div>You are not authorized.</div>;
  }

  return (
    <div className='w-full max-w-5xl mx-auto px-4 py-6'>
      <Card className='p-4 sm:p-6'>
        <h2 className='text-xl font-semibold mb-4'>Messages</h2>

        {loading ? (
          <p className='text-muted-foreground text-sm text-center'>
            Loading messages...
          </p>
        ) : chats.length === 0 ? (
          <p className='text-muted-foreground text-sm text-center'>
            No messages yet.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Concern Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.map((chat) => (
                  <TableRow key={chat.id}>
                    <TableCell className='text-sm'>{chat.buyerName}</TableCell>
                    <TableCell className='text-sm'>
                      {chat.concernType}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={chat.chatPath}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Button size='sm' className='bg-green-600 text-white'>
                          Open
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SupplierMessages;
