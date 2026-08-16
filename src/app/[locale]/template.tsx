"use client";

import React, { useEffect, useState } from "react";

export default function RouteTemplate({ children }: { children: React.ReactNode }) {
  const [showScanline, setShowScanline] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScanline(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showScanline && <div className="scanline-overlay" aria-hidden="true" />}
      {children}
    </>
  );
}
