"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { showSuccess } from "@/utils/toastUtils"; // ✅ Toast only now

function OrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser?.uid) return;

      setLoading(true);
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      const groupedOrders = {};
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000)
          : null;

        const order = {
          id: doc.id,
          transactionId: data.transactionId || "N/A",
          billNumber: data.billNumber || "N/A",
          totalAmount: data.totalAmount || "0.00",
          orderStatus: data.orderStatus || "Pending",
          createdAt: createdAt ? createdAt.toLocaleString() : "Unknown Date",
          paymentMethod: data.paymentMethod || "Unknown",
        };

        const method = order.paymentMethod;
        if (!groupedOrders[method]) groupedOrders[method] = [];
        groupedOrders[method].push(order);
      });

      setOrders(groupedOrders);
      setLoading(false);
    };

    fetchOrders();
  }, [currentUser]);

  useEffect(() => {
    const paymentsRef = collection(db, "payments");
    const unsubscribe = onSnapshot(paymentsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const paymentData = change.doc.data();
          const billNumber = change.doc.id;
          const { paymentStatus, paymentAmount } = paymentData;

          setOrders((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((method) => {
              updated[method] = updated[method].map((order) =>
                String(order.billNumber) === String(billNumber)
                  ? { ...order, orderStatus: paymentStatus }
                  : order
              );
            });
            return updated;
          });

          if (paymentStatus === "APPROVED") {
            showSuccess(
              `Payment for Invoice #${billNumber} of ${paymentAmount} SR is Approved! 🎉`
            );
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <h2 className='text-2xl font-bold text-primary text-center mb-6'>
        Your Orders
      </h2>

      {loading ? (
        <p className='text-center text-gray-500'>Loading orders...</p>
      ) : Object.keys(orders).length === 0 ? (
        <p className='text-center text-gray-500'>No orders found.</p>
      ) : (
        Object.keys(orders).map((method) => (
          <div key={method} className='mb-10'>
            <h3 className='text-lg font-semibold text-primary mb-4'>
              {method} Orders
            </h3>

            {/* Desktop Table */}
            <div className='hidden sm:block'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left border border-gray-200 rounded-md'>
                  <thead className='bg-gray-100'>
                    <tr>
                      <th className='px-4 py-2'>Transaction ID</th>
                      <th className='px-4 py-2'>Payment Method</th>
                      <th className='px-4 py-2'>Total Amount</th>
                      <th className='px-4 py-2'>Status</th>
                      <th className='px-4 py-2'>Date</th>
                      <th className='px-4 py-2'>Review Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders[method].map((order) => (
                      <tr key={order.id} className='border-t hover:bg-gray-50'>
                        <td className='px-4 py-2'>{order.transactionId}</td>
                        <td className='px-4 py-2'>{order.paymentMethod}</td>
                        <td className='px-4 py-2'>{order.totalAmount} SR</td>
                        <td className='px-4 py-2'>
                          <span
                            className={`font-medium ${
                              order.orderStatus === "APPROVED"
                                ? "text-green-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className='px-4 py-2'>{order.createdAt}</td>
                        <td className='px-4 py-2'>
                          {order.orderStatus === "APPROVED" ? (
                            <Link
                              href={`/review-invoice/${order.billNumber}`}
                              className='inline-block bg-primary text-white px-3 py-1 rounded hover:opacity-90 text-xs'
                            >
                              Review Invoice
                            </Link>
                          ) : (
                            <span className='text-gray-400 text-xs'>
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className='block sm:hidden'>
              {orders[method].map((order) => (
                <div
                  key={order.id}
                  className='bg-white rounded-lg shadow-md p-4 mb-4'
                >
                  <h4 className='text-primary font-semibold mb-2'>
                    {order.paymentMethod}
                  </h4>
                  <p className='text-sm text-gray-700 mb-1'>
                    <strong>Transaction:</strong> {order.transactionId}
                  </p>
                  <p className='text-sm text-gray-700 mb-1'>
                    <strong>Total:</strong> {order.totalAmount} SR
                  </p>
                  <p className='text-sm text-gray-700 mb-1'>
                    <strong>Status:</strong>
                    <span
                      className={`ml-2 ${
                        order.orderStatus === "APPROVED"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </p>
                  <p className='text-sm text-gray-700 mb-3'>
                    <strong>Date:</strong> {order.createdAt}
                  </p>
                  {order.orderStatus === "APPROVED" ? (
                    <Link
                      href={`/review-invoice/${order.billNumber}`}
                      className='block w-full text-center bg-primary text-white text-sm py-2 rounded hover:opacity-90'
                    >
                      Review Invoice
                    </Link>
                  ) : (
                    <span className='block w-full text-center text-gray-400 text-sm py-2 border rounded'>
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default OrdersPage;
