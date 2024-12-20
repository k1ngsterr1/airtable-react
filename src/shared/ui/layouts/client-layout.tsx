import reactQueryClient from "@/shared/api/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <QueryClientProvider client={reactQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default ClientLayout;
