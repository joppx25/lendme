"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { clearLoanReturnCookie } from "@/app/loans/management-actions";

interface ToastClientProps {
  actionReturn: {
    value: string;
  } | undefined;
}

export function ToastClient({ actionReturn }: ToastClientProps) {
  const hasProcessedRef = useRef(false);
  const processedValueRef = useRef<string | null>(null);

  useEffect(() => {
    if (actionReturn && actionReturn.value) {
      // Prevent processing the same value multiple times
      if (hasProcessedRef.current && processedValueRef.current === actionReturn.value) {
        console.log("Already processed this value, skipping");
        return;
      }

      try {
        // Validate that the value is not empty and is valid JSON
        const trimmedValue = actionReturn.value.trim();
        if (!trimmedValue) {
          console.warn("Empty cookie value, skipping toast");
          return;
        }

        const data = JSON.parse(trimmedValue);
        
        // Mark as processed before showing toast
        hasProcessedRef.current = true;
        processedValueRef.current = actionReturn.value;
        
        if (data.success) {
          toast.success(data.message || "Operation completed successfully");
        } else {
          toast.error(data.message || "Operation failed");
        }
        
        // Clean up the cookie immediately after showing the toast
        setTimeout(() => {
          clearLoanReturnCookie();
        }, 100);
        
      } catch (error) {
        console.error("Error parsing action return data:", error);
        console.error("Raw cookie value:", actionReturn.value);
        toast.error("An error occurred while processing the response");
        
        // Mark as processed even if there was an error
        hasProcessedRef.current = true;
        processedValueRef.current = actionReturn.value;
        
        // Clean up the cookie even if there was an error
        setTimeout(() => {
          clearLoanReturnCookie();
        }, 100);
      }
    }
  }, [actionReturn]);

  return null;
}
