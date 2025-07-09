"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { cn } from "@/lib/utils"

const Toaster = ({ className, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group", className)}
      style={
        {
          '--normal-bg': '#1C1F2E',
          '--normal-text': '#fff',
          '--normal-border': 'transparent',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }