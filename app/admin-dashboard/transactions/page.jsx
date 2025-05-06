"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import sarSymbol from "@/assets/sar_symbol.svg";

const PAGE_SIZE = 10;

const AdminTransactions = () => {
  const { userData } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [paginatedTransactions, setPaginatedTransactions] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    paid: 0,
    pending: 0,
    failed: 0,
  });
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const prevTransactionCount = useRef(0);
  const audioRef = useRef(null);

  // 🔒 Redirect if not admin
  useEffect(() => {
    if (!userData || userData.role !== "admin") {
      router.push("/admin-login");
    }
  }, [userData, router]);

  // 🔁 Fetch Orders (Live)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
          return bTime - aTime;
        });

      if (data.length > prevTransactionCount.current) {
        try {
          audioRef.current?.play();
        } catch {
          toast("🔔 New order received!");
        }
      }
      prevTransactionCount.current = data.length;

      const counts = { paid: 0, pending: 0, failed: 0 };
      data.forEach((order) => {
        const status = order.orderStatus?.toLowerCase();
        if (status === "paid") counts.paid++;
        if (status === "pending") counts.pending++;
        if (status === "failed") counts.failed++;
      });

      setStatusCounts(counts);
      setTransactions(data);
      setFilteredTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔍 Filter logic
  useEffect(() => {
    let filtered = [...transactions];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) =>
          order.orderStatus?.toLowerCase?.() === statusFilter.toLowerCase()
      );
    }

    if (searchEmail.trim() !== "") {
      filtered = filtered.filter((order) =>
        order.userEmail?.toLowerCase?.().includes(searchEmail.toLowerCase())
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((order) => {
        const date = order.createdAt?.toDate?.();
        if (!date) return false;

        if (dateFilter === "7days") {
          const daysAgo = new Date();
          daysAgo.setDate(now.getDate() - 7);
          return date >= daysAgo;
        }

        if (dateFilter === "thisMonth") {
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        }

        return true;
      });
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [statusFilter, searchEmail, dateFilter, transactions]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedTransactions(filteredTransactions.slice(startIndex, endIndex));
  }, [filteredTransactions, currentPage]);

  const handleExportCSV = () => {
    const headers = ["Order ID", "Email", "Amount", "Status", "Date"];
    const rows = filteredTransactions.map((order) => [
      order.id,
      order.userEmail || "N/A",
      Number(order.totalAmount || 0).toFixed(2),
      order.orderStatus,
      order.createdAt?.toDate?.().toLocaleString() || "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = filteredTransactions.reduce(
    (acc, order) => acc + Number(order.totalAmount || 0),
    0
  );

  if (loading) return <p className='text-center mt-10'>Loading...</p>;

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <h2 className='text-xl font-semibold text-[#2c6449] mb-4'>
        All Client Transactions
      </h2>

      <audio ref={audioRef} src='/sounds/notification.mp3' preload='auto' />

      <div className='flex flex-wrap gap-3 mb-5'>
        <Input
          placeholder='Search by email'
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className='w-64'
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='border border-gray-300 px-3 py-2 rounded text-sm'
        >
          <option value='all'>All Statuses</option>
          <option value='paid'>Paid ({statusCounts.paid})</option>
          <option value='pending'>Pending ({statusCounts.pending})</option>
          <option value='failed'>Failed ({statusCounts.failed})</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className='border border-gray-300 px-3 py-2 rounded text-sm'
        >
          <option value='all'>All Time</option>
          <option value='7days'>Last 7 Days</option>
          <option value='thisMonth'>This Month</option>
        </select>

        <Button onClick={handleExportCSV} className='bg-[#2c6449] text-white'>
          Export CSV
        </Button>
      </div>

      <div className='overflow-auto border rounded-md'>
        <table className='min-w-full text-sm'>
          <thead className='bg-[#2c6449] text-white'>
            <tr>
              <th className='p-2 text-left'>Order ID</th>
              <th className='p-2 text-left'>Email</th>
              <th className='p-2 text-left'>Amount</th>
              <th className='p-2 text-left'>Status</th>
              <th className='p-2 text-left'>Date</th>
              <th className='p-2 text-left'>Items</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((order) => {
              const isFailed = order.orderStatus?.toLowerCase?.() === "failed";
              const isExpanded = expandedOrderId === order.id;

              return (
                <tr key={order.id} className='border-b'>
                  <td className='p-2'>{order.id}</td>
                  <td className='p-2'>{order.userEmail || "N/A"}</td>
                  <td className='p-2 flex items-center gap-1'>
                    <img src={sarSymbol.src} alt='SAR' className='w-4 h-4' />
                    {Number(order.totalAmount || 0).toFixed(2)}
                  </td>
                  <td
                    className={`p-2 capitalize font-medium ${
                      isFailed
                        ? "text-red-600 bg-red-100 px-2 rounded"
                        : "text-green-700"
                    }`}
                  >
                    {order.orderStatus || "N/A"}
                  </td>
                  <td className='p-2'>
                    {order.createdAt?.toDate?.().toLocaleString() || "N/A"}
                  </td>
                  <td className='p-2'>
                    <button
                      onClick={() =>
                        setExpandedOrderId(isExpanded ? null : order.id)
                      }
                      className='text-sm text-[#2c6449] underline'
                    >
                      {isExpanded ? "Hide" : "View"}
                    </button>
                    {isExpanded && (
                      <ul className='text-xs mt-2 list-disc ml-4'>
                        {order.items?.map((item, i) => (
                          <li key={i}>
                            {item.name} – {item.quantity} x{" "}
                            {Number(item.price || 0).toFixed(2)}
                          </li>
                        )) || <li>No items listed</li>}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className='text-right mt-4 text-sm font-medium text-[#2c6449]'>
        Total Revenue:{" "}
        <span className='inline-flex items-center gap-1'>
          <img src={sarSymbol.src} alt='SAR' className='w-4 h-4' />
          {totalRevenue.toFixed(2)}
        </span>
      </div>

      <div className='flex justify-center mt-6 gap-2'>
        {Array.from(
          { length: Math.ceil(filteredTransactions.length / PAGE_SIZE) },
          (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded border text-sm ${
                currentPage === i + 1
                  ? "bg-[#2c6449] text-white"
                  : "border-[#2c6449] text-[#2c6449]"
              }`}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;
