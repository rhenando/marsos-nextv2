"use client";

import Link from "next/link";

const NavLinks = ({ show }) => {
  return (
    <div
      className={`hidden lg:block absolute top-full left-0 w-full z-40 transition-opacity duration-300 ease-in-out ${
        show
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      } bg-white px-6 py-2 text-base text-[#2c6449] border-t border-b border-gray-200`}
    >
      <div className='flex items-center justify-between'>
        {/* LEFT: Categories + Navigation */}
        <div className='flex items-center space-x-6 rtl:space-x-reverse'>
          <Link
            href='/categories'
            className='flex items-center gap-1 font-semibold hover:text-[#1b4533] transition-all'
          >
            All Categories
          </Link>

          <Link
            href='/products'
            className='hover:text-[#1b4533] transition-all'
          >
            Featured
          </Link>

          <Link
            href='/products'
            className='hover:text-[#1b4533] transition-all'
          >
            Trending
          </Link>
        </div>

        {/* RIGHT: Support & Actions */}
        <div className='flex items-center space-x-6 rtl:space-x-reverse'>
          <Link href='/' className='hover:text-[#1b4533] transition-all'>
            Secured Trading
          </Link>

          <Link
            href='/help-center'
            className='hover:text-[#1b4533] transition-all'
          >
            Help Center
          </Link>

          {/* Uncomment these if you want later:
          <Link
            href="/top"
            className="hover:text-[#1b4533] transition-all"
          >
            Get App
          </Link>

          <Link
            href="/secured"
            className="hover:text-[#1b4533] transition-all"
          >
            Buyer Central
          </Link>
          */}

          <Link
            href='/become-supplier'
            className='hover:text-[#1b4533] transition-all'
          >
            Become a Supplier
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NavLinks;
