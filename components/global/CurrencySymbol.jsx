"use client";

import Image from "next/image";
import sarSymbol from "../../public/sar_symbol.svg";

const Currency = ({ amount, className = "", iconClass = "" }) => {
  const formattedAmount =
    typeof amount === "number"
      ? amount.toFixed(2)
      : parseFloat(amount || 0).toFixed(2);

  return (
    <span className='inline-flex items-center gap-1'>
      <Image
        src={sarSymbol}
        alt='SAR'
        width={16}
        height={16}
        className={iconClass}
        priority
      />
      <span className={className}>{formattedAmount}</span>
    </span>
  );
};

export default Currency;
