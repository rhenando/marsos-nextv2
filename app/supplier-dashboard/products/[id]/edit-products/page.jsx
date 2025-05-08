"use client";

import React from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreatableSelect } from "@/components/ui/creatable-select";
import {
  defaultLocationOptions,
  defaultSizeOptions,
  defaultColorOptions,
  defaultQuantityOptions,
} from "@/lib/productOptions";

export default function UploadProductForm() {
  return (
    <form className='space-y-6 p-4 md:p-6 max-w-screen-lg mx-auto'>
      {/* Basic Info */}
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold'>Basic Info</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input placeholder='Product Name (English)' />
          <Input placeholder='Product Description (English)' />
          <Input placeholder='اسم المنتج (Arabic)' />
          <Input placeholder='وصف المنتج (Arabic)' />
        </div>
      </div>

      {/* Product Details */}
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold'>Product Details</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          <CreatableSelect
            placeholder='Select or Create a Category'
            options={[]}
          />
          <CreatableSelect
            placeholder='Select or Create a Subcategory'
            options={[]}
            isDisabled
          />
          <CreatableSelect
            placeholder='Main Location'
            options={defaultLocationOptions}
          />
          <CreatableSelect
            placeholder='Select Size(s)'
            isMulti
            options={defaultSizeOptions}
          />
          <CreatableSelect
            placeholder='Select Color(s)'
            isMulti
            options={defaultColorOptions}
          />
        </div>
      </div>

      {/* Images */}
      <div className='space-y-2'>
        <h2 className='text-lg md:text-xl font-semibold'>Product Images</h2>
        <div className='flex flex-col gap-4 md:flex-row md:items-start'>
          {/* Main Image */}
          <div className='flex flex-col gap-1 w-full md:w-1/3'>
            <Label className='text-sm'>Main Image</Label>
            <Input
              type='file'
              accept='image/*'
              className='file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-green-600'
            />
          </div>

          {/* Additional Images */}
          <div className='flex-1 flex flex-col gap-2'>
            <Label className='text-sm'>Additional Images</Label>
            <div className='flex items-center gap-2'>
              <Input
                type='file'
                accept='image/*'
                className='file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-green-600'
              />
              <Button variant='ghost' className='text-red-600'>
                Remove
              </Button>
            </div>
            <Button variant='link' size='sm'>
              + Add Additional Images
            </Button>
            <p className='text-xs text-muted-foreground'>
              You can upload up to 3 additional images.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Tier */}
      <div className='border p-4 rounded-md space-y-4'>
        <div className='flex justify-between items-center'>
          <h3 className='text-base font-medium'>Price Tier</h3>
          <Button variant='ghost' className='text-red-600'>
            Remove
          </Button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <CreatableSelect
            placeholder='Min Qty'
            options={defaultQuantityOptions}
          />
          <CreatableSelect
            placeholder='Max Qty'
            options={defaultQuantityOptions}
          />
          <CreatableSelect
            placeholder='Price'
            options={defaultQuantityOptions}
          />
        </div>
        <div>
          <Label>Delivery Locations</Label>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2 my-2'>
            <div className='w-full sm:w-1/2 md:w-1/3'>
              <CreatableSelect
                placeholder='Select or Create a Location'
                options={defaultLocationOptions}
              />
            </div>
            <div className='w-36'>
              <CreatableSelect
                placeholder='Price'
                options={defaultQuantityOptions}
              />
            </div>
            <Button variant='ghost' className='text-red-600'>
              Remove
            </Button>
          </div>
          <Button variant='link'>+ Add Location</Button>
        </div>
        <Button variant='outline'>+ Add Price Tier</Button>
      </div>

      {/* Submit Button */}
      <div className='sticky bottom-0 bg-white py-4 px-4 md:px-0'>
        <Button className='w-full bg-primary hover:bg-green-600'>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
