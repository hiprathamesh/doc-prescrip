"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={{
        "--normal-bg": theme === "dark" ? "var(--popover)" : "#ffffff",
        "--normal-text": theme === "dark" ? "var(--popover-foreground)" : "#1f2937",
        "--normal-border": theme === "dark" ? "var(--border)" : "#e5e7eb",
        "--success-bg": theme === "dark" ? "#064e3b" : "#f0f9ff",
        "--success-text": theme === "dark" ? "#34d399" : "#047857",
        "--error-bg": theme === "dark" ? "#7f1d1d" : "#fef2f2",
        "--error-text": theme === "dark" ? "#f87171" : "#dc2626",
        "--warning-bg": theme === "dark" ? "#7c2d12" : "#fffbeb",
        "--warning-text": theme === "dark" ? "#fbbf24" : "#d97706",
        "--info-bg": theme === "dark" ? "#1e3a8a" : "#eff6ff",
        "--info-text": theme === "dark" ? "#60a5fa" : "#2563eb"
      }}
      toastOptions={{
        style: {
          background: "var(--normal-bg)",
          color: "var(--normal-text)",
          border: "1px solid var(--normal-border)",
          fontSize: "14px",
          fontWeight: "500"
        },
        className: "toast-custom"
      }}
      {...props} />
  );
}

export { Toaster }
