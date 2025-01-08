import { CustomSidebar } from "@/features/ui/sidebar/ui/sidebar";
import React from "react";

interface ISidebarLayout {
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<ISidebarLayout> = ({ children }) => {
  return (
    <>
      <CustomSidebar />
      {children}
    </>
  );
};
