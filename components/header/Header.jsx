"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import RfqModal from "../rfq/Rfq";
import ProductSearch from "@/components/header/ProductSearch";

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
  Globe,
  LogOut,
  Home,
} from "react-feather";

const Header = () => {
  const { cartItemCount, userRole } = useCart();
  const { currentUser, userData, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showRFQModal, setShowRFQModal] = useState(false);

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

        {/* Center: Search (hidden on mobile) */}
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
                <span className='text-sm hidden lg:inline'>Account</span>
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
                    Dashboard
                  </Button>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => router.push("/user-login")}
                >
                  Sign In
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Messages */}
          <Link href='/user-messages'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MessageSquare size={18} />
              <span className='text-sm hidden lg:inline'>Messages</span>
            </Button>
          </Link>

          {/* Cart */}
          {userRole !== "admin" && userRole !== "supplier" && (
            <Link href='/cart' className='relative'>
              <Button variant='ghost' className='flex items-center gap-2'>
                <ShoppingCart size={18} />
                <span className='text-sm hidden lg:inline'>Cart</span>
              </Button>
              {cartItemCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-[#2c6449] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center'>
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}

          {/* RFQ Button */}
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2 text-[#2c6449] border-[#2c6449]'
            onClick={() => setShowRFQModal(true)}
          >
            <Send size={16} />
            <span className='text-sm hidden lg:inline'>Request RFQ</span>
          </Button>

          {/* Location */}
          <Link href='/basket'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MapPin size={18} />
              <span className='text-sm hidden lg:inline'>Location</span>
            </Button>
          </Link>

          {/* Language Switcher */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size='icon' variant='ghost' className='rounded-full'>
                <Globe size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-32 text-sm'>
              <Button variant='ghost' className='w-full justify-start'>
                English
              </Button>
              <Button variant='ghost' className='w-full justify-start'>
                العربية
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile: Hamburger Menu */}
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
                    Home
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
                      Dashboard
                    </Button>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className='mr-2' />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => router.push("/user-login")}
                  >
                    <User size={16} className='mr-2' />
                    Sign In
                  </Button>
                )}
                <Link href='/user-messages'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MessageSquare size={16} className='mr-2' />
                    Messages
                  </Button>
                </Link>
                {userRole !== "admin" && userRole !== "supplier" && (
                  <Link href='/cart'>
                    <Button variant='ghost' className='w-full justify-start'>
                      <ShoppingCart size={16} className='mr-2' />
                      Cart
                    </Button>
                  </Link>
                )}
                <Link href='/basket'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MapPin size={16} className='mr-2' />
                    Location
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  className='w-full justify-start text-[#2c6449] border-[#2c6449]'
                  onClick={() => setShowRFQModal(true)}
                >
                  <Send size={16} className='mr-2' />
                  Request RFQ
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search bar on Mobile */}
      <div className='block md:hidden px-4 mt-2'>
        <ProductSearch />
      </div>

      {/* RFQ Modal */}
      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />
    </header>
  );
};

export default Header;
