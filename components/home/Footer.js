import React, { useEffect } from "react";
import {
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Globe,
} from "react-feather";
import { useTranslation } from "react-i18next";

import saudiLogo from "../assets/saudi_business_logo.svg";
import visa from "../assets/visa.png";
import mastercard from "../assets/mastercard.png";
import applepay from "../assets/applepay.png";
import mada from "../assets/mada.png";
import tamara from "../assets/tamara.png";
import tabby from "../assets/tabby.png";

const Footer = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://gogetssl-cdn.s3.eu-central-1.amazonaws.com/site-seals/gogetssl-seal.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <footer className='bg-[#2c6449] text-white text-sm'>
      <div className='max-w-screen-xl mx-auto px-4 py-10'>
        {/* Top Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
          {/* About */}
          <div>
            <h3 className='font-semibold text-white mb-3'>
              {t("footer.aboutTitle")}
            </h3>
            <p className='text-gray-200'>{t("footer.aboutText")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='font-semibold text-white mb-3'>
              {t("footer.quickLinks")}
            </h3>
            <ul className='space-y-2'>
              <li>
                <a href='/top-supplier' className='hover:underline'>
                  {t("footer.browseSuppliers")}
                </a>
              </li>
              <li>
                <a href='/products' className='hover:underline'>
                  {t("footer.exploreProducts")}
                </a>
              </li>
              <li>
                <a href='/categories' className='hover:underline'>
                  {t("footer.viewCategories")}
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className='font-semibold text-white mb-3'>
              {t("footer.support")}
            </h3>
            <ul className='space-y-2'>
              <li>
                <a href='/faq' className='hover:underline'>
                  {t("footer.helpCenter")}
                </a>
              </li>
              <li>
                <a
                  href='/updated-terms-and-conditions'
                  className='hover:underline'
                >
                  {t("footer.terms")}
                </a>
              </li>
              <li>
                <a href='/updated-privacy-policy' className='hover:underline'>
                  {t("footer.privacy")}
                </a>
              </li>
            </ul>
          </div>

          {/* Language + Social */}
          <div>
            <h3 className='font-semibold text-white mb-3'>
              {t("footer.language")}
            </h3>
            <div className='flex gap-4 mb-4 flex-wrap'>
              <button className='bg-white text-[#2c6449] px-3 py-1 rounded'>
                English
              </button>
              <button className='bg-white text-[#2c6449] px-3 py-1 rounded'>
                العربية
              </button>
            </div>
            <h3 className='font-semibold text-white mb-3'>
              {t("footer.followUs")}
            </h3>
            <div className='flex gap-4 flex-wrap text-white'>
              <Instagram size={18} />
              <Linkedin size={18} />
              <Twitter size={18} />
              <Facebook size={18} />
              <Youtube size={18} />
              <Globe size={18} />
            </div>
          </div>
        </div>

        {/* Payments + Logo + SSL */}
        <div className='mt-10 flex flex-col md:flex-row justify-between items-center gap-y-6 border-t pt-6'>
          {/* Saudi Logo */}
          <img
            src={saudiLogo}
            alt='Saudi Business Center'
            className='w-auto h-16'
          />

          {/* Payment Methods */}
          <div className='flex flex-wrap justify-center gap-3'>
            {[visa, mastercard, applepay, mada, tamara, tabby].map(
              (logo, i) => (
                <img
                  key={i}
                  src={logo}
                  alt='Payment'
                  className='h-4 object-contain'
                />
              )
            )}
          </div>

          {/* GoGetSSL Seal */}
          <div className='text-center'>
            <a
              href='https://www.gogetssl.com'
              rel='nofollow'
              title='GoGetSSL Site Seal Logo'
            >
              <div
                id='gogetssl-animated-seal'
                style={{
                  width: "160px",
                  height: "58px",
                  display: "inline-block",
                }}
              ></div>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className='text-center text-xs text-gray-300 mt-6'>
          {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
