"use client";

import { createContext, useContext, useState } from "react";

const HeaderPaddingContext = createContext();

export function useHeaderPadding() {
  return useContext(HeaderPaddingContext);
}

export function HeaderPaddingProvider({ children }) {
  const [needsPadding, setNeedsPadding] = useState(true); // Default: needs padding

  return (
    <HeaderPaddingContext.Provider value={{ needsPadding, setNeedsPadding }}>
      {children}
    </HeaderPaddingContext.Provider>
  );
}
