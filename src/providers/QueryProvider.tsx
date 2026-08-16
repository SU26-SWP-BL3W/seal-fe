"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // retry: 1 lam moi query hong ton GAP DOI thoi gian cho (timeout
            // 6s x2 = 12s). Backend chet thi thu lai cung vo ich — fallback empty ngay.
            retry: 0,
            // Doi tab roi quay lai khong nen ban lai loat request (moi lan lai
            // cho timeout neu backend dang sap).
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
