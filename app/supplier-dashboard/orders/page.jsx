"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
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

const SupplierOrdersPage = () => {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredOrderId, setHoveredOrderId] = useState(null);
  const [notifiedBills, setNotifiedBills] = useState(new Set());

  useEffect(() => {
    const fetchSupplierOrders = async () => {
      if (!currentUser?.uid) return;

      const snapshot = await getDocs(collection(db, "orders"));
      const filtered = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const supplierInItems = data.items?.some(
          (item) => item.supplierId === currentUser.uid
        );
        if (!supplierInItems) return;

        const createdAt = data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000).toLocaleString()
          : "Unknown";

        filtered.push({
          id: docSnap.id,
          sadadNumber: data.sadadNumber || "N/A",
          billNumber: data.billNumber || "N/A",
          totalAmount: data.totalAmount || "0.00",
          orderStatus: data.orderStatus || "Pending",
          createdAt,
          buyerId: data.items?.[0]?.buyerId || null,
        });
      });

      setOrders(filtered);
      setLoading(false);
    };

    fetchSupplierOrders();
  }, [currentUser]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payments"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const payment = change.doc.data();
        const billNumber = change.doc.id;

        if (change.type === "added" || change.type === "modified") {
          setOrders((prev) =>
            prev.map((order) =>
              String(order.billNumber) === String(billNumber)
                ? { ...order, orderStatus: payment.paymentStatus }
                : order
            )
          );

          if (
            payment.paymentStatus === "APPROVED" &&
            !notifiedBills.has(billNumber)
          ) {
            toast.success(
              `✅ Payment Approved for Order #${billNumber}: ${payment.paymentAmount} SR`
            );
            setNotifiedBills((prev) => new Set(prev).add(billNumber));
          }
        }
      });
    });

    return () => unsub();
  }, [notifiedBills]);

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

  const renderStatusClass = (status) =>
    status === "APPROVED" ? "text-green-600 font-medium" : "text-yellow-600";

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
          {/* Desktop Table */}
          <div className='hidden md:block'>
            <Card className='p-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SADAD</TableHead>
                    <TableHead>Bill</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Service Fee (0%)</TableHead>
                    <TableHead>Billed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const net = parseFloat(order.totalAmount);
                    const fee = 0;
                    const billed = net - fee;
                    return (
                      <TableRow key={order.id}>
                        <TableCell>{order.sadadNumber}</TableCell>
                        <TableCell>{order.billNumber}</TableCell>
                        <TableCell>{net.toFixed(2)} SR</TableCell>
                        <TableCell>{fee.toFixed(2)} SR</TableCell>
                        <TableCell>{billed.toFixed(2)} SR</TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className='md:hidden space-y-4'>
            {orders.map((order) => {
              const net = parseFloat(order.totalAmount);
              const fee = 0;
              const billed = net - fee;

              return (
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
                    Net: {net.toFixed(2)} SR
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Service Fee: {fee.toFixed(2)} SR
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Billed: {billed.toFixed(2)} SR
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
                      hoveredOrderId === order.id
                        ? "bg-[#2c6449] text-white"
                        : ""
                    } border-[#2c6449] text-[#2c6449]`}
                  >
                    Contact Buyer
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SupplierOrdersPage;
