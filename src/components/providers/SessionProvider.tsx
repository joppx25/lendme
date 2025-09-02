"use client";

import { useEffect, useRef } from "react";
import { useAuthStore, User } from "@/store/authStore";

export function SessionProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const { setUser } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once to prevent re-render loops
    if (!hasInitialized.current) {
      setUser(initialUser);
      hasInitialized.current = true;
    }
  }, [initialUser, setUser]);

  return <>{children}</>;
}
