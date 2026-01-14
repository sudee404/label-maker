"use client";

import type React from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

export default function MyProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
