"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-900/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border-gray-700/50 group-[.toaster]:shadow-2xl",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-pink-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-800 group-[.toast]:text-gray-300",
          success: "group-[.toast]:border-green-500/30",
          error: "group-[.toast]:border-red-500/30",
          warning: "group-[.toast]:border-yellow-500/30",
          info: "group-[.toast]:border-blue-500/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
