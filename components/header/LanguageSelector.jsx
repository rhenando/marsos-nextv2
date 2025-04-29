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
  const [open, setOpen] = useState(false); // ✅ Control popover open/close

  useEffect(() => {
    const savedLang = localStorage.getItem("app-language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
      setSelectedLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    } else {
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
    }
  }, [i18n]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng).then(() => {
      setSelectedLanguage(lng);
      localStorage.setItem("app-language", lng);
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
      setOpen(false); // just close popover
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size='icon' variant='ghost' className='rounded-full'>
          <Globe size={18} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='end'
        className='w-40 text-sm z-[9999]'
        sideOffset={8}
        forceMount
      >
        {loading ? (
          <div className='text-center py-2 text-[#2c6449] font-semibold'>
            Loading...
          </div>
        ) : (
          <>
            <Button
              variant={selectedLanguage === "en" ? "default" : "ghost"}
              className='w-full justify-start'
              onClick={() => changeLanguage("en")}
            >
              English
            </Button>
            <Button
              variant={selectedLanguage === "ar" ? "default" : "ghost"}
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
