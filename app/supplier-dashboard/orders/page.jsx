"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { db } from "../../../firebase/config";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import Link from "next/link";
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

export default function SupplierOrdersPage() {
  const { user: currentUser, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredOrderId, setHoveredOrderId] = useState(null);
  const [notifiedBills, setNotifiedBills] = useState(new Set());

  // 1) Fetch this supplier’s orders once on mount
  useEffect(() => {
    async function fetchSupplierOrders() {
      if (!currentUser?.uid) return;

      const snapshot = await getDocs(collection(db, "orders"));
      const filtered = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // only keep orders that include this supplier
        if (!data.items?.some((i) => i.supplierId === currentUser.uid)) {
          return;
        }

        // normalize createdAt
        let createdAt = "Unknown";
        if (data.createdAt?.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000).toLocaleString();
        } else if (typeof data.createdAt === "string") {
          createdAt = new Date(data.createdAt).toLocaleString();
        }

        // bill + sadad
        const billNumber = data.billNumber || data.orderId || "N/A";
        const sadadNumber = data.sadadNumber || "N/A";

        // coerce total -> Number
        const rawTotal = data.total ?? data.totalAmount ?? 0;
        const totalAmount =
          typeof rawTotal === "string" ? parseFloat(rawTotal) : rawTotal;

        // coerce vat -> Number
        const rawVat = data.vat ?? 0;
        const vat = typeof rawVat === "string" ? parseFloat(rawVat) : rawVat;

        // compute net = total − vat
        const net = totalAmount - vat;

        const orderStatus = data.orderStatus || data.status || "Pending";

        // figure out buyerId
        const buyerId =
          data.buyerId ||
          data.customer?.uid ||
          data.items?.[0]?.buyerId ||
          null;

        filtered.push({
          id: docSnap.id,
          sadadNumber,
          billNumber,
          totalAmount, // guaranteed Number
          vat, // guaranteed Number
          net, // computed Number
          orderStatus,
          createdAt,
          buyerId,
        });
      });

      setOrders(filtered);
      setLoading(false);
    }

    fetchSupplierOrders();
  }, [currentUser]);

  // 2) Listen for payment updates...
  useEffect(() => {
    let firstRun = true;
    const unsub = onSnapshot(collection(db, "payments"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const bill = change.doc.id;
        const payment = change.doc.data();

        // update status
        setOrders((prev) =>
          prev.map((o) =>
            o.billNumber === bill
              ? { ...o, orderStatus: payment.paymentStatus }
              : o
          )
        );

        // toast once per bill on APPROVED
        if (
          !firstRun &&
          payment.paymentStatus === "APPROVED" &&
          !notifiedBills.has(bill) &&
          orders.some((o) => o.billNumber === bill)
        ) {
          toast.success(
            `✅ Payment Approved for Order #${bill}: ${payment.paymentAmount} SR`
          );
          setNotifiedBills((prev) => new Set(prev).add(bill));
        }
      });
      firstRun = false;
    });
    return () => unsub();
  }, [orders, notifiedBills]);

  const goToChat = (order) => {
    const chatId = `order_${order.buyerId}_${currentUser.uid}`;
    const extraData = {
      billNumber: order.billNumber,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
    };
    router.push(
      `/order-chat/${chatId}?extraData=${encodeURIComponent(
        JSON.stringify(extraData)
      )}`
    );
  };

  const renderStatusClass = (s) =>
    s === "APPROVED" ? "text-green-600 font-medium" : "text-yellow-600";

  return (
    <div className='w-full max-w-6xl mx-auto px-4 py-6'>
      <h2 className='text-2xl font-semibold mb-6'>Supplier Orders</h2>
      {loading ? (
        <p className='text-center text-sm text-muted-foreground'>
          Loading orders...
        </p>
      ) : orders.length === 0 ? (
        <p className='text-center text-sm text-muted-foreground'>
          No orders found.
        </p>
      ) : (
        <>
          {/* Desktop */}
          <div className='hidden md:block'>
            <Card className='p-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SADAD</TableHead>
                    <TableHead>Bill</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Service Fee (0%)</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.sadadNumber}</TableCell>
                      <TableCell>{order.billNumber}</TableCell>
                      <TableCell>{order.net.toFixed(2)} SR</TableCell>
                      <TableCell>{(0).toFixed(2)} SR</TableCell>
                      <TableCell>{order.totalAmount.toFixed(2)} SR</TableCell>
                      <TableCell
                        className={renderStatusClass(order.orderStatus)}
                      >
                        {order.orderStatus}
                      </TableCell>
                      <TableCell>{order.createdAt}</TableCell>
                      <TableCell className='space-x-2'>
                        <Link
                          href={
                            order.orderStatus === "APPROVED"
                              ? `/review-invoice/${order.billNumber}`
                              : "#"
                          }
                        >
                          <Button
                            size='sm'
                            variant={
                              order.orderStatus === "APPROVED"
                                ? "default"
                                : "secondary"
                            }
                            disabled={order.orderStatus !== "APPROVED"}
                          >
                            Review Invoice
                          </Button>
                        </Link>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => goToChat(order)}
                          onMouseEnter={() => setHoveredOrderId(order.id)}
                          onMouseLeave={() => setHoveredOrderId(null)}
                          className={`transition ${
                            hoveredOrderId === order.id
                              ? "bg-[#2c6449] text-white"
                              : ""
                          } border-[#2c6449] text-[#2c6449]`}
                        >
                          Contact Buyer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile */}
          <div className='md:hidden space-y-4'>
            {orders.map((order) => (
              <Card key={order.id} className='p-4 shadow-md'>
                <h3 className='text-sm font-medium mb-2'>
                  Invoice:{" "}
                  <span className='text-muted-foreground'>
                    {order.billNumber}
                  </span>
                </h3>
                <p className='text-sm text-muted-foreground'>
                  SADAD: {order.sadadNumber}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Net: {order.net.toFixed(2)} SR
                </p>
                <p className='text-sm text-muted-foreground'>
                  Service Fee: {(0).toFixed(2)} SR
                </p>
                <p className='text-sm text-muted-foreground'>
                  Total: {order.totalAmount.toFixed(2)} SR
                </p>
                <p className='text-sm text-muted-foreground'>
                  Status:{" "}
                  <span className={renderStatusClass(order.orderStatus)}>
                    {order.orderStatus}
                  </span>
                </p>
                <p className='text-sm text-muted-foreground mb-2'>
                  Date: {order.createdAt}
                </p>
                <Link
                  href={
                    order.orderStatus === "APPROVED"
                      ? `/review-invoice/${order.billNumber}`
                      : "#"
                  }
                >
                  <Button
                    size='sm'
                    className='w-full mb-2'
                    disabled={order.orderStatus !== "APPROVED"}
                  >
                    Review Invoice
                  </Button>
                </Link>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => goToChat(order)}
                  onMouseEnter={() => setHoveredOrderId(order.id)}
                  onMouseLeave={() => setHoveredOrderId(null)}
                  className={`w-full ${
                    hoveredOrderId === order.id ? "bg-[#2c6449] text-white" : ""
                  } border-[#2c6449] text-[#2c6449]`}
                >
                  Contact Buyer
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
