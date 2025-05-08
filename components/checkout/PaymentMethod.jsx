"use client";
import * as React from "react";
import { useSavedCards } from "@/hooks/useSavedCards";
import { PaymentOptionSection } from "./PaymentOptionSection";

export function PaymentMethod({
  openSection,
  setOpenSection,
  selectedMethod,
  setSelectedMethod,
  selectedPaymentId,
  setSelectedPaymentId,
}) {
  const {
    cards,
    isLoading: cardLoading,
    error: cardError,
    reload: reloadCards,
  } = useSavedCards();

  const cardOptions = React.useMemo(
    () =>
      cards.map((c) => ({ id: c.id, label: c.label, subtitle: c.subtitle })),
    [cards]
  );

  return (
    <>
      <h2 className='text-xl font-semibold text-[#2c6449] mt-4'>
        Payment Method
      </h2>

      {/* Card */}
      <PaymentOptionSection
        title='Debit/Credit Card'
        options={cardOptions}
        open={openSection === "card"}
        onToggle={() => setOpenSection(openSection === "card" ? null : "card")}
        loading={cardLoading}
        error={cardError}
        selectedId={selectedMethod === "card" ? selectedPaymentId : null}
        onSelect={(opt) => {
          setSelectedMethod("card");
          setSelectedPaymentId(opt.id);
        }}
        addNewLabel='Add New Card'
        onAddNew={reloadCards}
      />

      {/* SADAD */}
      <PaymentOptionSection
        title='SADAD'
        options={[{ id: "sadad", label: "Proceed with SADAD" }]}
        open={openSection === "sadad"}
        onToggle={() =>
          setOpenSection(openSection === "sadad" ? null : "sadad")
        }
        loading={false}
        error={null}
        selectedId={selectedMethod === "sadad" ? "sadad" : null}
        onSelect={() => {
          setSelectedMethod("sadad");
          setSelectedPaymentId("sadad");
        }}
        addNewLabel=''
        onAddNew={null}
      />

      {/* E-Wallets */}
      <PaymentOptionSection
        title='E-Wallet Options'
        options={[
          { id: "Google Pay", label: "Google Pay" },
          { id: "Apple Pay", label: "Apple Pay" },
          { id: "Samsung Pay", label: "Samsung Pay" },
        ]}
        open={openSection === "ewallet"}
        onToggle={() =>
          setOpenSection(openSection === "ewallet" ? null : "ewallet")
        }
        loading={false}
        error={null}
        selectedId={selectedMethod === "ewallet" ? selectedPaymentId : null}
        onSelect={(opt) => {
          setSelectedMethod("ewallet");
          setSelectedPaymentId(opt.id);
        }}
        addNewLabel=''
        onAddNew={null}
      />
    </>
  );
}
