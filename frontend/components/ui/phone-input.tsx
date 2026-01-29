"use client"

import * as React from "react"
import PhoneInputWithCountry from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import "react-phone-number-input/style.css"
import { cn } from "@/lib/utils"

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string
  onChange?: (value: string | undefined) => void
  defaultCountry?: any
}

const CustomInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        {...props}
        ref={ref}
        className={cn(
          "flex h-12 md:h-10 w-full rounded-lg border border-input bg-background px-4 py-3 text-base md:text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-gray-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9933] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "text-foreground",
          className
        )}
      />
    )
  }
)
CustomInput.displayName = "CustomPhoneInput"

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value, ...props }, ref) => {
    return (
      <PhoneInputWithCountry
        flags={flags}
        international
        defaultCountry="IN"
        value={value}
        onChange={onChange as (value?: string | undefined) => void}
        className={cn("phone-input-dark", className)}
        inputComponent={CustomInput}
        {...props}
      />
    )
  }
)

PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
