"use client";

import React from 'react';

interface LoadingSpinnerProps {
  title?: string;
  subtitle?: string;
}

export default function LoadingSpinner({ 
  title = "Loading...",
  subtitle 
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen text-center background-primary color-senary">
      <svg className="animate-spin h-10 w-10 mb-3 color-octonary lg:h-12 lg:w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="font-semibold text-base lg:text-lg">{title}</p>
      {subtitle && (
        <p className="color-quaternary text-xs lg:text-sm">{subtitle}</p>
      )}
    </div>
  );
}