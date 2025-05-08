// components/navbar-wrapper.tsx
"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { Navbar } from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

export function NavbarWrapper() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <SidebarProvider>
      <Navbar variant="withSidebar" />
    </SidebarProvider>
  ) : (
    <Navbar variant="default" />
  );
}
