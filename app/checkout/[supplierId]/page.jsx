"use client";

import React from "react";
import { useParams } from "next/navigation";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export default function CheckoutPage() {
  const { supplierId } = useParams();
  return <CheckoutClient supplierId={supplierId} />;
}
