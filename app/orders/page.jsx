// app/orders/page.jsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import Currency from "@/components/global/CurrencySymbol";

const OrdersPage = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      const q = query(
        collection(db, "orders"),
        where("buyerId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(results);
    };

    fetchOrders();
  }, [currentUser]);

  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <h1 className='text-2xl font-bold text-[#2c6449] mb-6'>My Orders</h1>

      {orders.length === 0 ? (
        <p className='text-gray-600'>You haven't placed any orders yet.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className='border mb-6 p-4 rounded-lg bg-white shadow-sm'
          >
            <h2 className='text-lg font-semibold text-[#2c6449]'>
              Supplier: {order.supplierId}
            </h2>
            <p className='text-sm text-gray-500 mb-2'>
              Status: {order.orderStatus}
            </p>
            <ul className='text-sm text-gray-700 space-y-1 mb-2'>
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.productName} × {item.quantity}
                </li>
              ))}
            </ul>
            <div className='text-sm text-gray-800'>
              <p>
                Subtotal: <Currency amount={order.subtotal} />
              </p>
              <p>
                Shipping: <Currency amount={order.shipping} />
              </p>
              <p>
                VAT: <Currency amount={order.vat} />
              </p>
              <p className='font-bold text-[#2c6449]'>
                Total: <Currency amount={order.total} />
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OrdersPage;
