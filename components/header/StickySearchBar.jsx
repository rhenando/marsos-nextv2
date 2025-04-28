"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Camera,
  Globe,
  MessageSquare,
  Clipboard,
  ShoppingCart,
  User,
} from "react-feather";
import { useTranslation } from "react-i18next";

const StickySearchBar = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("sa");

  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const countryNames = {
    sa: "Saudi Arabia",
    ae: "UAE",
    qa: "Qatar",
    om: "Oman",
    kw: "Kuwait",
    bh: "Bahrain",
  };

  return (
    <div className='fixed top-0 left-0 w-full bg-white shadow-sm z-[9999] h-20 flex items-center justify-between px-4 md:px-6 transition-all'>
      {/* Logo */}
      <Link href='/' className='flex items-center gap-1'>
        <img
          src='/logo.png'
          alt='Logo'
          className='h-12 w-auto object-contain'
        />
      </Link>

      {/* Search Box */}
      <div className='flex flex-1 mx-4 items-center max-w-3xl border rounded-full overflow-hidden shadow-sm h-10'>
        <div className='px-3 border-r text-gray-600 text-sm flex items-center gap-1 h-full'>
          {t("sticky.products")}
        </div>
        <input
          type='text'
          placeholder={t("sticky.search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='flex-1 px-4 text-sm h-full focus:outline-none'
        />
        <button className='px-3'>
          <Camera size={20} className='text-gray-500' />
        </button>
        <button
          onClick={handleSearch}
          className='bg-[#ff6600] hover:bg-[#e55b00] text-white text-sm px-4 rounded-r-full flex items-center gap-1 h-full'
        >
          <Search size={16} />
          {t("sticky.research")}
        </button>
      </div>

      {/* Delivery and Icons */}
      <div className='hidden md:flex items-center gap-4 text-gray-600'>
        {/* Delivery to */}
        <div className='text-xs flex flex-col items-center'>
          <span>{t("sticky.delivery_to")}</span>
          <span className='flex items-center gap-1'>
            <img
              src={`https://flagcdn.com/w20/${selectedCountry}.png`}
              alt={countryNames[selectedCountry]}
              className='w-5 h-4 object-cover rounded-sm'
            />
            {selectedCountry.toUpperCase()}
          </span>
        </div>

        {/* Icons */}
        <button>
          <Globe size={20} />
        </button>
        <button className='relative'>
          <MessageSquare size={20} />
          <span className='absolute -top-1 -right-2 text-[10px] bg-[#ff6600] text-white rounded-full w-4 h-4 flex items-center justify-center'>
            63
          </span>
        </button>
        <button>
          <Clipboard size={20} />
        </button>
        <button>
          <ShoppingCart size={20} />
        </button>
        <button>
          <User size={20} />
        </button>
      </div>
    </div>
  );
};

export default StickySearchBar;
