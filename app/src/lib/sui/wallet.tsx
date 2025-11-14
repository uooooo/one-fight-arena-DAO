"use client";

import { WalletKitProvider } from "@mysten/wallet-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function SuiWalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletKitProvider>
        {children}
      </WalletKitProvider>
    </QueryClientProvider>
  );
}
