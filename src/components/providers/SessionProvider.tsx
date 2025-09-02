"use client";

import { useEffect } from "react";
import { useAuthStore, User } from "@/store/authStore";

export function SessionProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    } else {
      setUser(null);
    }
  }, [initialUser, setUser]);

  return <>{children}</>;
}
