"use client";
import * as React from "react";
import { useSavedAddresses } from "@/hooks/useSavedAddresses";
import { PaymentOptionSection } from "./PaymentOptionSection";

export function DeliveryAddress({
  openSection,
  setOpenSection,
  selectedAddress,
  setSelectedAddress,
}) {
  const {
    addresses,
    isLoading: addrLoading,
    error: addrError,
    reload: reloadAddresses,
  } = useSavedAddresses();

  const options = React.useMemo(
    () =>
      addresses.map((a) => ({
        id: a.id,
        label: `${a.label}: ${a.line1}, ${a.line2}`,
      })),
    [addresses]
  );

  return (
    <>
      <h2 className='text-xl font-semibold text-[#2c6449]'>Delivery Address</h2>

      <PaymentOptionSection
        title='Select Address'
        options={options}
        open={openSection === "address"}
        onToggle={() =>
          setOpenSection(openSection === "address" ? null : "address")
        }
        loading={addrLoading}
        error={addrError}
        selectedId={selectedAddress?.id}
        onSelect={(opt) =>
          setSelectedAddress(addresses.find((a) => a.id === opt.id) || null)
        }
        addNewLabel='Add New Address'
        onAddNew={reloadAddresses}
      />
    </>
  );
}
