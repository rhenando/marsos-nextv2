"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Globe } from "react-feather";

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const browserLang = navigator.language || navigator.userLanguage;

    if (browserLang.startsWith("ar")) {
      i18n.changeLanguage("ar");
      setSelectedLanguage("ar");
      document.documentElement.dir = "rtl";
    } else {
      i18n.changeLanguage("en");
      setSelectedLanguage("en");
      document.documentElement.dir = "ltr";
    }
  }, []);

  const changeLanguage = (lng) => {
    setLoading(true); // Start loading
    i18n.changeLanguage(lng).then(() => {
      setSelectedLanguage(lng);
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";

      // After slight delay, remove loading
      setTimeout(() => {
        setLoading(false);
      }, 500);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size='icon' variant='ghost' className='rounded-full'>
          <Globe size={18} />
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-32 text-sm'>
        {loading ? (
          <div className='text-center py-2 text-[#2c6449] font-semibold'>
            Loading...
          </div>
        ) : (
          <>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => changeLanguage("en")}
            >
              English
            </Button>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => changeLanguage("ar")}
            >
              العربية
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSelector;
