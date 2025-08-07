
"use client";

import { toast as sonnerToast } from "sonner";
import * as React from "react";

// Define a consistent interface that works with our existing code
export type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: "default" | "destructive";
  duration?: number;
  id?: string | number;
};

// Create a toast function that provides the same API but uses Sonner under the hood
const toast = (props: ToastProps) => {
  const { title, description, variant, action, ...rest } = props;

  // For error toasts, use Sonner's error variant
  if (variant === "destructive") {
    return sonnerToast.error(title as string, {
      description: description,
      ...rest,
      // Handle action if present
      action: action ? {
        label: (action as React.ReactElement).props.children,
        onClick: (action as React.ReactElement).props.onClick,
      } : undefined,
    });
  }

  // For regular toasts
  return sonnerToast(title as string, {
    description: description,
    ...rest,
    // Handle action if present
    action: action ? {
      label: (action as React.ReactElement).props.children,
      onClick: (action as React.ReactElement).props.onClick,
    } : undefined,
  });
};

// Create a hook that mimics the original useToast API
const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    // We don't need the toasts array since Sonner manages this internally
    toasts: [],
  };
};

export { useToast, toast };

