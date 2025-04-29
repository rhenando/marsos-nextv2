"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toastUtils";

export default function SupplierOrdersPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredOrderId, setHoveredOrderId] = useState(null);

  useEffect(() => {
    const fetchSupplierOrders = async () => {
      if (!currentUser?.uid) return;

      const ordersRef = collection(db, "orders");
      const snapshot = await getDocs(ordersRef);
      const filteredOrders = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const buyerIdFromItem = data.items?.[0]?.buyerId || null;

        const supplierInItems = data.items?.some(
          (item) => item.supplierId === currentUser.uid
        );

        if (supplierInItems) {
          const createdAt = data.createdAt?.seconds
            ? new Date(data.createdAt.seconds * 1000)
            : null;

          filteredOrders.push({
            id: docSnap.id,
            sadadNumber: data.sadadNumber || "N/A",
            billNumber: data.billNumber || "N/A",
            totalAmount: data.totalAmount || "0.00",
            orderStatus: data.orderStatus || "Pending",
            createdAt: createdAt ? createdAt.toLocaleString() : "Unknown Date",
            buyerId: buyerIdFromItem,
          });
        }
      });

      setOrders(filteredOrders);
      setLoading(false);
    };

    fetchSupplierOrders();
  }, [currentUser?.uid]);

  useEffect(() => {
    const paymentsRef = collection(db, "payments");

    const unsubscribe = onSnapshot(paymentsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (["modified", "added"].includes(change.type)) {
          const paymentData = change.doc.data();
          const billNumber = change.doc.id;
          const { paymentStatus, paymentAmount } = paymentData;

          setOrders((prev) =>
            prev.map((order) =>
              String(order.billNumber) === String(billNumber)
                ? { ...order, orderStatus: paymentStatus }
                : order
            )
          );

          if (paymentStatus === "APPROVED") {
            showSuccess(
              `Payment for Order #${billNumber} of ${paymentAmount} SR is Approved! 🎉`
            );
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <p className='p-6 text-sm text-center text-gray-600'>Loading orders...</p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className='p-6 text-sm text-center text-gray-500'>No orders found.</p>
    );
  }

  return (
    <div className='max-w-7xl mx-auto p-4'>
      <h2 className='text-2xl font-semibold mb-6'>Supplier Orders</h2>

      <div className='overflow-x-auto border rounded'>
        <table className='min-w-full text-sm'>
          <thead className='bg-[#2c6449] text-white'>
            <tr>
              <th className='px-4 py-2'>Sadad Number</th>
              <th className='px-4 py-2'>Bill Number</th>
              <th className='px-4 py-2'>Net Amount</th>
              <th className='px-4 py-2'>Service Fee (0%)</th>
              <th className='px-4 py-2'>Billed Amount</th>
              <th className='px-4 py-2'>Status</th>
              <th className='px-4 py-2'>Date</th>
              <th className='px-4 py-2'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {orders.map((order) => {
              const netAmount = parseFloat(order.totalAmount);
              const serviceFee = 0;
              const billedAmount = netAmount - serviceFee;

              return (
                <tr key={order.id} className='hover:bg-gray-50'>
                  <td className='px-4 py-2'>{order.sadadNumber}</td>
                  <td className='px-4 py-2'>{order.billNumber}</td>
                  <td className='px-4 py-2'>{netAmount.toFixed(2)} SR</td>
                  <td className='px-4 py-2'>{serviceFee.toFixed(2)} SR</td>
                  <td className='px-4 py-2'>{billedAmount.toFixed(2)} SR</td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      order.orderStatus === "APPROVED"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {order.orderStatus}
                  </td>
                  <td className='px-4 py-2 whitespace-nowrap'>
                    {order.createdAt}
                  </td>
                  <td className='px-4 py-2 whitespace-nowrap flex gap-2'>
                    <Link
                      href={
                        order.orderStatus === "APPROVED"
                          ? `/review-invoice/${order.billNumber}`
                          : "#"
                      }
                      className={`px-3 py-1 text-xs rounded font-medium ${
                        order.orderStatus === "APPROVED"
                          ? "bg-[#2c6449] text-white hover:bg-[#24523b]"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        if (order.orderStatus !== "APPROVED")
                          e.preventDefault();
                      }}
                    >
                      Review Invoice
                    </Link>

                    <Button
                      variant='outline'
                      size='sm'
                      className={`text-xs border-[#2c6449] text-[#2c6449] hover:bg-[#2c6449] hover:text-white`}
                      onMouseEnter={() => setHoveredOrderId(order.id)}
                      onMouseLeave={() => setHoveredOrderId(null)}
                      onClick={() => {
                        const chatId = `order_${order.buyerId}_${currentUser.uid}`;
                        const extraData = encodeURIComponent(
                          JSON.stringify({
                            billNumber: order.billNumber,
                            totalAmount: order.totalAmount,
                            orderStatus: order.orderStatus,
                          })
                        );
                        router.push(
                          `/order-chat/${chatId}?extraData=${extraData}`
                        );
                      }}
                    >
                      Contact Buyer
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
