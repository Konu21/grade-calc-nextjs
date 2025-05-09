// components/ConditionalThemeToggle.tsx
"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/auth/useAuth";

export function ConditionalThemeToggle() {
  const { isAuthenticated } = useAuth();

  return (
    <div
      className={`
      fixed 
      ${isAuthenticated ? "md:hidden" : "hidden"}
      top-4 
      right-4
      z-50
    `}
    >
      <ThemeToggle />
    </div>
  );
}
