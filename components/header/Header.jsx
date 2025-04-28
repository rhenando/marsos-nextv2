"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import RfqModal from "../rfq/Rfq";
import ProductSearch from "@/components/header/ProductSearch";
import LanguageSelector from "@/components/header/LanguageSelector";

import { Button } from "../ui/button";
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";

import {
  Menu,
  User,
  MessageSquare,
  ShoppingCart,
  MapPin,
  Send,
  LogOut,
  Home,
} from "react-feather";

const Header = () => {
  const { cartItemCount, userRole } = useCart();
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showRFQModal, setShowRFQModal] = useState(false);

  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/user-login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className='sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-sm'>
      <div className='flex items-center justify-between px-4 md:px-6 py-3'>
        {/* Left: Logo */}
        <Link href='/' className='flex items-center gap-2'>
          <img
            src='/logo.png'
            alt='Company Logo'
            className='h-20 object-contain'
          />
        </Link>

        {/* Center: Search */}
        <div className='hidden md:flex flex-1 mx-6 relative'>
          <ProductSearch />
        </div>

        {/* Right: Actions */}
        <div className='hidden md:flex items-center gap-4 text-[#2c6449]'>
          {/* User Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='ghost' className='flex items-center gap-2'>
                <User size={18} />
                <span className='text-sm hidden lg:inline'>
                  {t("header.account")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-40 text-sm'>
              {currentUser ? (
                <>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => {
                      if (userRole === "buyer") router.push("/buyer-dashboard");
                      if (userRole === "supplier")
                        router.push("/supplier-dashboard");
                      if (userRole === "admin") router.push("/admin-dashboard");
                    }}
                  >
                    {t("header.dashboard")}
                  </Button>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={handleLogout}
                  >
                    {t("header.logout")}
                  </Button>
                </>
              ) : (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => router.push("/user-login")}
                >
                  {t("header.signin")}
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Messages */}
          <Link href='/user-messages'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MessageSquare size={18} />
              <span className='text-sm hidden lg:inline'>
                {t("header.messages")}
              </span>
            </Button>
          </Link>

          {/* Cart */}
          {userRole !== "admin" && userRole !== "supplier" && (
            <Link href='/cart' className='relative'>
              <Button variant='ghost' className='flex items-center gap-2'>
                <ShoppingCart size={18} />
                <span className='text-sm hidden lg:inline'>
                  {t("header.cart")}
                </span>
              </Button>
              {cartItemCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-[#2c6449] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center'>
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}

          {/* RFQ */}
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2 text-[#2c6449] border-[#2c6449]'
            onClick={() => setShowRFQModal(true)}
          >
            <Send size={16} />
            <span className='text-sm hidden lg:inline'>
              {t("header.request_rfq")}
            </span>
          </Button>

          {/* Location */}
          <Link href='/basket'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MapPin size={18} />
              <span className='text-sm hidden lg:inline'>
                {t("header.location")}
              </span>
            </Button>
          </Link>

          {/* Language Selector */}
          <LanguageSelector />
        </div>

        {/* Mobile Hamburger */}
        <div className='flex md:hidden'>
          <Sheet>
            <SheetTrigger asChild>
              <Button size='icon' variant='ghost' className='rounded-full'>
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64'>
              <div className='flex flex-col gap-4 mt-4 text-[#2c6449]'>
                <Link href='/'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <Home size={16} className='mr-2' />
                    {t("header.home")}
                  </Button>
                </Link>
                {currentUser ? (
                  <>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={() => {
                        if (userRole === "buyer")
                          router.push("/buyer-dashboard");
                        if (userRole === "supplier")
                          router.push("/supplier-dashboard");
                        if (userRole === "admin")
                          router.push("/admin-dashboard");
                      }}
                    >
                      {t("header.dashboard")}
                    </Button>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className='mr-2' />
                      {t("header.logout")}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => router.push("/user-login")}
                  >
                    <User size={16} className='mr-2' />
                    {t("header.signin")}
                  </Button>
                )}
                <Link href='/user-messages'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MessageSquare size={16} className='mr-2' />
                    {t("header.messages")}
                  </Button>
                </Link>
                {userRole !== "admin" && userRole !== "supplier" && (
                  <Link href='/cart'>
                    <Button variant='ghost' className='w-full justify-start'>
                      <ShoppingCart size={16} className='mr-2' />
                      {t("header.cart")}
                    </Button>
                  </Link>
                )}
                <Link href='/basket'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MapPin size={16} className='mr-2' />
                    {t("header.location")}
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  className='w-full justify-start text-[#2c6449] border-[#2c6449]'
                  onClick={() => setShowRFQModal(true)}
                >
                  <Send size={16} className='mr-2' />
                  {t("header.request_rfq")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 🚀 NAVLINKS DIRECTLY BELOW */}
      <div className='hidden lg:block w-full bg-white px-6 py-2 text-base text-[#2c6449] border-t border-b border-gray-200'>
        <div className='flex justify-between items-center flex-wrap gap-y-2'>
          {/* LEFT: Categories and Links */}
          <div className='flex flex-wrap items-center gap-x-6'>
            <Link
              href='/categories'
              className='font-semibold hover:text-[#1b4533] transition-all'
            >
              {t("header.all_categories")}
            </Link>
            <Link
              href='/products'
              className='hover:text-[#1b4533] transition-all'
            >
              {t("header.featured")}
            </Link>
            <Link
              href='/products'
              className='hover:text-[#1b4533] transition-all'
            >
              {t("header.trending")}
            </Link>
          </div>

          {/* RIGHT: Support & Actions */}
          <div className='flex flex-wrap items-center gap-x-6'>
            <Link href='/' className='hover:text-[#1b4533] transition-all'>
              {t("header.secured_trading")}
            </Link>
            <Link
              href='/help-center'
              className='hover:text-[#1b4533] transition-all'
            >
              {t("header.help_center")}
            </Link>
            <Link
              href='/become-supplier'
              className='hover:text-[#1b4533] transition-all'
            >
              {t("header.become_supplier")}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className='block md:hidden px-4 mt-2'>
        <ProductSearch />
      </div>

      {/* RFQ Modal */}
      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />
    </header>
  );
};

export default Header;
