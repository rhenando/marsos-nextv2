"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  User,
  MessageCircle,
  ShoppingCart,
  Send,
  MapPin,
  Globe,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const navLinks = [
  { href: "/account", label: "Account", icon: User },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/request-rfq", label: "Request RFQ", icon: Send },
  { href: "/location", label: "Location", icon: MapPin },
  { href: "/language", label: "Language", icon: Globe },
];

const secondaryLinks = [
  { href: "/category/electronics", label: "Electronics" },
  { href: "/category/fashion", label: "Fashion" },
  { href: "/category/home", label: "Home" },
  { href: "/category/tools", label: "Tools" },
  { href: "/category/sports", label: "Sports" },
  { href: "/category/automotive", label: "Automotive" },
];

export default function Header() {
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", search);
    // Optional: useRouter().push(`/search?q=${search}`);
  };

  return (
    <header className='sticky top-0 z-50 w-full bg-white shadow'>
      {/* Top Navbar */}
      <div className='border-b'>
        <div className='mx-auto flex h-28 max-w-8xl items-center justify-between px-4 md:px-6'>
          {/* Left: Logo */}
          <Link href='/' className='flex items-center'>
            <Image src='/logo.svg' alt='Logo' width={46} height={46} priority />
          </Link>

          {/* Center: Search bar (desktop only) */}
          <form
            onSubmit={handleSearch}
            className='hidden md:flex flex-1 justify-center'
          >
            <Input
              type='search'
              placeholder='Search...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full max-w-md'
            />
          </form>

          {/* Right: Desktop nav / Mobile menu */}
          <div className='flex items-center gap-4'>
            {/* Desktop Navigation */}
            <nav className='hidden md:flex gap-6'>
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className='flex flex-col items-center text-sm font-medium text-muted-foreground hover:text-primary transition'
                >
                  <Icon className='mb-1 h-5 w-5' />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu */}
            <div className='md:hidden'>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size='icon' variant='outline'>
                    <Menu className='h-5 w-5' />
                  </Button>
                </SheetTrigger>
                <SheetContent side='right' className='w-64'>
                  <div className='mt-6 flex flex-col gap-4'>
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch}>
                      <Input
                        type='search'
                        placeholder='Search...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </form>

                    {/* Mobile nav links */}
                    {navLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className='flex items-center gap-2 text-base font-medium text-foreground hover:text-primary'
                      >
                        <Icon className='h-5 w-5' />
                        {label}
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Navbar */}
      <div className='border-b bg-gray-50'>
        <div className='mx-auto flex h-10 max-w-8xl items-center justify-between px-4 md:px-6'>
          {/* Left Side: First 3 links */}
          <div className='flex gap-6'>
            {secondaryLinks.slice(0, 3).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className='text-sm font-medium text-muted-foreground hover:text-primary transition'
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side: Last 3 links */}
          <div className='flex gap-6'>
            {secondaryLinks.slice(3).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className='text-sm font-medium text-muted-foreground hover:text-primary transition'
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
