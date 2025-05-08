"use client";
import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { RefreshCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function PaymentOptionSection({
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
    <div>
      <button
        onClick={onToggle}
        className='w-full px-4 py-3 border rounded flex justify-between items-center bg-white'
      >
        <span className='font-medium text-[#2c6449]'>{title}</span>
        <ChevronsUpDown className='h-4 w-4 text-gray-500' />
      </button>

      {open && (
        <div className='p-4 border-t rounded-b bg-white'>
          {loading ? (
            <div className='space-y-2'>
              <Skeleton className='h-6' />
              <Skeleton className='h-6' />
              <Skeleton className='h-6' />
            </div>
          ) : error ? (
            <div className='space-y-2'>
              <p className='text-red-600'>{error}</p>
              <Button onClick={onAddNew}>Retry</Button>
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

          {addNewLabel && onAddNew && !loading && (
            <Button
              variant='outline'
              size='sm'
              className='w-full mt-2'
              onClick={onAddNew}
            >
              + {addNewLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
