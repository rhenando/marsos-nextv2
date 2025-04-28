"use client";

import React, { useState, useEffect } from "react";

const LanguageSelector = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [languageTimeout, setLanguageTimeout] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  useEffect(() => {
    document.documentElement.dir =
      selectedLanguage === "العربية" ? "rtl" : "ltr";
  }, [selectedLanguage]);

  const handleLanguageChange = (label) => {
    setSelectedLanguage(label);
    document.documentElement.dir = label === "العربية" ? "rtl" : "ltr";
    setShowMenu(false);
  };

  return (
    <div
      className='relative flex flex-col items-center cursor-pointer text-[#2c6449]'
      onMouseEnter={() => {
        clearTimeout(languageTimeout);
        setShowMenu(true);
      }}
      onMouseLeave={() => {
        const timeout = setTimeout(() => setShowMenu(false), 200);
        setLanguageTimeout(timeout);
      }}
    >
      <img
        src={`https://flagcdn.com/h20/${
          selectedLanguage === "English" ? "us" : "sa"
        }.png`}
        alt='flag'
        className='w-5 h-5 mb-1 object-contain rounded-sm'
      />
      <div className='flex items-center gap-1'>
        <span>{selectedLanguage}</span>
        <svg
          className='w-4 h-4 mt-[2px]'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </div>

      {showMenu && (
        <ul className='absolute right-0 top-full mt-2 w-[80px] bg-white border border-gray-200 rounded shadow-md z-50 text-sm text-[#2c6449]'>
          <li
            className='px-4 py-2 hover:bg-[#2c6449] hover:text-white cursor-pointer'
            onClick={() => handleLanguageChange("English")}
          >
            English
          </li>
          <li
            className='px-4 py-2 hover:bg-[#2c6449] hover:text-white cursor-pointer'
            onClick={() => handleLanguageChange("العربية")}
          >
            العربية
          </li>
        </ul>
      )}
    </div>
  );
};

export default LanguageSelector;
