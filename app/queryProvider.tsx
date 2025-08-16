'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [quesyClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={quesyClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
