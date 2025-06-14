"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  code: string;
  name: string;
}

interface SelectCurrencyProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SelectCurrency({ options, value, onChange, placeholder }: SelectCurrencyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOptionName = options.find(option => option.code === value)?.name || placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectRef]);


  const handleOptionClick = (optionCode: string) => {
    onChange(optionCode);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-1.5 font-bold background-tertiary color-quinary border line-senary rounded-sm shadow-sm outline-none cursor-pointer text-xs lg:text-[10px] xl:text-xs 2xl:text-sm"
      >
        <span>{selectedOptionName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="absolute z-20 w-full mt-1 background-tertiary border line-senary rounded-sm shadow-lg max-h-60 overflow-auto">
          {options.map(option => (
            <li
              key={option.code}
              onClick={() => handleOptionClick(option.code)}
              className="px-3 py-1.5 font-semibold color-quinary cursor-pointer hover:bg-yellow-400 hover:color-primary lg:py-2 text-xs lg:text-[10px] xl:text-xs 2xl:text-sm"
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}