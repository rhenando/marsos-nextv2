"use client";

import * as React from "react";
import { ChevronsUpDown, RefreshCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Currency from "@/components/global/CurrencySymbol";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

// --- Mock loaders (replace with real APIs) ---
const loadSavedAddresses = () =>
  new Promise((res) =>
    setTimeout(
      () =>
        res([
          {
            id: "home",
            label: "Home",
            line1: "123 King Fahd St.",
            line2: "Riyadh 11451",
          },
          {
            id: "work",
            label: "Work",
            line1: "456 Olaya Rd.",
            line2: "Riyadh 12211",
          },
        ]),
      500
    )
  );

const loadSavedCards = () =>
  new Promise((res) =>
    setTimeout(
      () =>
        res([
          { id: "pm_visa", label: "Visa •••• 4242", subtitle: "Exp 12/25" },
          { id: "pm_mc", label: "Mastercard •••• 4444", subtitle: "Exp 09/24" },
        ]),
      500
    )
  );

// --- Data-fetching hooks with retry support ---
function useSavedAddresses() {
  const [addresses, setAddresses] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetch = React.useCallback(() => {
    setError(null);
    setIsLoading(true);
    loadSavedAddresses()
      .then(setAddresses)
      .catch(() => setError("Failed to load addresses"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(fetch, [fetch]);

  return { addresses, isLoading, error, reload: fetch };
}

function useSavedCards() {
  const [cards, setCards] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetch = React.useCallback(() => {
    setError(null);
    setIsLoading(true);
    loadSavedCards()
      .then(setCards)
      .catch(() => setError("Failed to load cards"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(fetch, [fetch]);

  return { cards, isLoading, error, reload: fetch };
}

// --- Reusable section component ---
function PaymentOptionSection({
  title,
  options,
  open,
  onToggle,
  loading,
  error,
  selectedId,
  onSelect,
  addNewLabel,
  onAddNew,
}) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <CollapsibleTrigger className='w-full px-4 py-3 border rounded flex justify-between items-center bg-white'>
        <span className='font-medium text-[#2c6449]'>{title}</span>
        <ChevronsUpDown className='h-4 w-4 text-gray-500' />
      </CollapsibleTrigger>

      <CollapsibleContent className='p-4 border-t rounded-b bg-white'>
        {loading ? (
          <div className='space-y-2'>
            <Skeleton className='h-6' />
            <Skeleton className='h-6' />
            <Skeleton className='h-6' />
          </div>
        ) : error ? (
          <div className='space-y-2'>
            <p className='text-red-600'>{error}</p>
            <Button onClick={onAddNew || (() => {})}>Retry</Button>
          </div>
        ) : options.length === 0 ? (
          <p className='text-gray-500'>No {title.toLowerCase()} found.</p>
        ) : (
          options.map((o) => (
            <div
              key={o.id}
              role='button'
              tabIndex={0}
              onClick={() => onSelect(o)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(o);
              }}
              className={`p-3 border rounded mb-2 cursor-pointer flex justify-between items-center ${
                selectedId === o.id
                  ? "border-[#2c6449] bg-[#f0fdf4]"
                  : "bg-white"
              }`}
            >
              <div>
                <p className='font-medium'>{o.label}</p>
                {o.subtitle && (
                  <p className='text-sm text-gray-600'>{o.subtitle}</p>
                )}
              </div>
              {selectedId === o.id && (
                <span className='text-[#2c6449] font-semibold'>✓</span>
              )}
            </div>
          ))
        )}

        {addNewLabel && onAddNew && !loading && !options.length && (
          <Button
            variant='outline'
            size='sm'
            className='w-full mt-2'
            onClick={onAddNew}
          >
            + {addNewLabel}
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function CheckoutPage() {
  // --- Which panel is open ---
  const [openSection, setOpenSection] = React.useState(null);

  // --- Data hooks ---
  const {
    addresses,
    isLoading: addrLoading,
    error: addrError,
    reload: reloadAddresses,
  } = useSavedAddresses();
  const {
    cards,
    isLoading: cardLoading,
    error: cardError,
    reload: reloadCards,
  } = useSavedCards();

  // --- User selections (store full object) ---
  const [selectedAddress, setSelectedAddress] = React.useState(null);
  const [selectedMethod, setSelectedMethod] = React.useState("");
  const [selectedPaymentId, setSelectedPaymentId] = React.useState("");

  // --- Memoized option lists ---
  const addressOptions = React.useMemo(
    () =>
      addresses.map((a) => ({
        id: a.id,
        label: `${a.label}: ${a.line1}, ${a.line2}`,
      })),
    [addresses]
  );

  const cardOptions = React.useMemo(
    () =>
      cards.map((c) => ({ id: c.id, label: c.label, subtitle: c.subtitle })),
    [cards]
  );

  // --- Validations ---
  const deliveryValid = Boolean(selectedAddress);
  const paymentValid = Boolean(selectedMethod && selectedPaymentId);

  // --- Order handler ---
  const handlePlaceOrder = () => {
    if (!deliveryValid || !paymentValid) return;
    const { label, line1, line2 } = selectedAddress;
    alert(
      `Ordering to '${label}, ${line1}, ${line2}' via '${selectedMethod}' (${selectedPaymentId})`
    );
  };

  return (
    <div className='min-h-screen bg-gray-50 text-base'>
      {/* Header */}
      <header className='bg-black text-white py-3'>
        <h1 className='text-center uppercase text-lg font-medium'>Checkout</h1>
      </header>

      {/* Main grid */}
      <div className='max-w-5xl mx-auto grid md:grid-cols-5 gap-4 py-8 px-4'>
        {/* Left: forms */}
        <div className='md:col-span-3 space-y-6'>
          {/* Delivery Address */}
          <h2 className='text-xl font-semibold text-[#2c6449]'>
            Delivery Address
          </h2>
          <PaymentOptionSection
            title='Select Address'
            options={addressOptions}
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

          {/* Payment Method */}
          <h2 className='text-xl font-semibold text-[#2c6449] mt-4'>
            Payment Method
          </h2>

          {/* Cards */}
          <PaymentOptionSection
            title='Debit/Credit Card'
            options={cardOptions}
            open={openSection === "card"}
            onToggle={() =>
              setOpenSection(openSection === "card" ? null : "card")
            }
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
        </div>

        {/* Right: order summary */}
        <aside className='hidden md:block md:col-span-2 bg-white p-4 rounded border space-y-4 sticky top-16'>
          <h2 className='text-xl font-semibold text-[#2c6449]'>
            Order Summary
          </h2>

          <div className='flex justify-between'>
            <p>Bike Basics Package</p>
            <Currency amount={1445} />
          </div>
          <div className='flex justify-between'>
            <p>All-Access Membership</p>
            <span className='line-through text-gray-500'>
              <Currency amount={44} />
            </span>
          </div>

          <div className='border-t pt-3 space-y-1'>
            <div className='flex justify-between'>
              <span>Subtotal</span>
              <Currency amount={1445} />
            </div>
            <div className='flex justify-between'>
              <span>Delivery Fee</span>
              <span>Included</span>
            </div>
            <div className='flex justify-between font-semibold text-lg'>
              <span>Total</span>
              <Currency amount={1445} />
            </div>
          </div>

          <Button
            onClick={handlePlaceOrder}
            disabled={!(deliveryValid && paymentValid)}
            className='w-full bg-[#2c6449] text-white mt-4'
          >
            Place Order
          </Button>
        </aside>
      </div>
    </div>
  );
}
