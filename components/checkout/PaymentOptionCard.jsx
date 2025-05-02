// components/checkout/PaymentOptionCard.jsx
"use client";

import Image from "next/image";

const PaymentOptionCard = ({
  label,
  value,
  iconPath,
  multipleIcons = [],
  selected,
  onSelect,
}) => {
  const handleClick = () => {
    onSelect(value);
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center text-center transition ${
        selected ? "border-[#2c6449] ring-2 ring-[#2c6449]" : "border-gray-300"
      }`}
    >
      <div className='flex flex-wrap justify-center items-center gap-2 mb-3'>
        {multipleIcons.length > 0 ? (
          multipleIcons.map((src, idx) => (
            <Image
              key={idx}
              src={src}
              alt={`${label} icon ${idx + 1}`}
              width={40}
              height={25}
              className='object-contain'
            />
          ))
        ) : (
          <Image
            src={iconPath}
            alt={`${label} icon`}
            width={40}
            height={25}
            className='object-contain'
          />
        )}
      </div>
      <p className='text-sm font-medium'>{label}</p>
    </div>
  );
};

export default PaymentOptionCard;
