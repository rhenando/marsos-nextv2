"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OrdersClient() {
  const { currentUser, loading, role } = useAuth();
  const [orders, setOrders] = useState({});
  const [seenNotifications, setSeenNotifications] = useState(new Set());

  useEffect(() => {
    if (loading || !currentUser || role !== "admin") return;

    const fetchOrders = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const grouped = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000).toLocaleString()
          : "Unknown";

        const order = {
          id: doc.id,
          transactionId: data.transactionId || "N/A",
          billNumber: data.billNumber || "N/A",
          totalAmount: data.totalAmount || "0.00",
          orderStatus: data.orderStatus || "Pending",
          createdAt,
          paymentMethod: data.paymentMethod || "Unknown",
          userName: data.userName || "Unknown",
          userEmail: data.userEmail || "Unknown",
        };

        const method = order.paymentMethod;
        if (!grouped[method]) grouped[method] = [];
        grouped[method].push(order);
      });

      setOrders(grouped);
    };

    fetchOrders();
  }, [currentUser, loading, role]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "payments"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (["added", "modified"].includes(change.type)) {
          const data = change.doc.data();
          const billNumber = change.doc.id;

          setOrders((prev) => {
            const updated = { ...prev };
            for (const method in updated) {
              updated[method] = updated[method].map((order) =>
                order.billNumber === billNumber
                  ? { ...order, orderStatus: data.paymentStatus }
                  : order
              );
            }
            return updated;
          });

          if (
            data.paymentStatus === "APPROVED" &&
            !seenNotifications.has(billNumber)
          ) {
            toast.success(
              `✅ Invoice #${billNumber} of ${data.paymentAmount} SR Approved!`
            );
            setSeenNotifications((prev) => new Set(prev).add(billNumber));
          }
        }
      });
    });

    return () => unsubscribe();
  }, [seenNotifications]);

  if (loading)
    return (
      <div className='py-10 text-center text-muted-foreground'>
        Authenticating...
      </div>
    );

  if (!currentUser?.uid || role !== "admin")
    return (
      <div className='py-10 text-center text-red-500'>
        ❌ You are not authorized to view this page.
      </div>
    );

  return (
    <div className='max-w-6xl mx-auto px-4 py-6'>
      <h2 className='text-2xl font-bold mb-6 text-[#2c6449] text-center'>
        All Orders
      </h2>

      {Object.keys(orders).length === 0 ? (
        <p className='text-center text-muted-foreground'>No orders found.</p>
      ) : (
        Object.entries(orders).map(([method, list]) => (
          <div key={method} className='mb-8'>
            <h3 className='text-lg font-semibold mb-3'>{method} Orders</h3>
            <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
              {list.map((order) => (
                <Card
                  key={order.id}
                  onClick={() =>
                    setSeenNotifications((prev) => {
                      const updated = new Set(prev);
                      updated.delete(order.billNumber);
                      return updated;
                    })
                  }
                  className='cursor-pointer hover:shadow-md transition'
                >
                  <CardContent className='p-4'>
                    <p className='text-sm font-medium'>
                      <strong>Transaction ID:</strong> {order.transactionId}
                    </p>
                    <p className='text-sm'>
                      <strong>Bill #:</strong> {order.billNumber}
                    </p>
                    <p className='text-sm'>
                      <strong>User:</strong> {order.userName}
                    </p>
                    <p className='text-sm'>
                      <strong>Email:</strong> {order.userEmail}
                    </p>
                    <p className='text-sm'>
                      <strong>Method:</strong> {order.paymentMethod}
                    </p>
                    <p className='text-sm'>
                      <strong>Total:</strong> {order.totalAmount} SR
                    </p>
                    <p className='text-sm'>
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          order.orderStatus === "APPROVED"
                            ? "text-green-600 font-semibold"
                            : "text-yellow-600"
                        }
                      >
                        {order.orderStatus}
                      </span>
                    </p>
                    <p className='text-sm mb-3'>
                      <strong>Date:</strong> {order.createdAt}
                    </p>
                    <Button
                      variant={
                        order.orderStatus === "APPROVED"
                          ? "default"
                          : "secondary"
                      }
                      className='w-full'
                      asChild
                      disabled={order.orderStatus !== "APPROVED"}
                    >
                      <Link href={`/review-invoice/${order.billNumber}`}>
                        Review Invoice
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
