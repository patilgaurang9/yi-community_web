"use client"

import { Control, FieldErrors, UseFormRegister, UseFormSetValue, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { cn } from "@/lib/utils"
import { ProfileFormData } from "@/lib/schemas/profile"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"

// Props interface for the stable component
interface IdentityFormProps {
    register: UseFormRegister<ProfileFormData>
    errors: FieldErrors<ProfileFormData>
    control: Control<ProfileFormData>
    setValue: UseFormSetValue<ProfileFormData>
    dob: Date | undefined
    defaultCountry?: any
}

export function IdentityForm({ register, errors, control, setValue, dob, defaultCountry }: IdentityFormProps) {
    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Half-width fields: First Name & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <Label htmlFor="first_name" className="text-sm font-medium md:text-sm">First Name *</Label>
                    <Input
                        id="first_name"
                        {...register("first_name")}
                        className={cn("h-12 md:h-10 text-base md:text-sm", errors.first_name && "border-destructive")}
                    />
                    {errors.first_name && (
                        <p className="text-sm text-[#FF8A80]">{errors.first_name.message}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="last_name" className="text-sm font-medium">Last Name (Optional)</Label>
                    <Input
                        id="last_name"
                        {...register("last_name")}
                        className={cn("h-12 md:h-10 text-base md:text-sm", errors.last_name && "border-destructive")}
                    />
                    {errors.last_name && (
                        <p className="text-sm text-[#FF8A80]">{errors.last_name.message}</p>
                    )}
                </div>
            </div>

            {/* Full-width field: Phone Number */}
            <div className="space-y-1">
                <Label htmlFor="phone_number" className="text-sm font-medium">Phone Number *</Label>
                <Controller
                    name="phone_number"
                    control={control}
                    render={({ field }) => (
                        <PhoneInput
                            {...field}
                            key="yi-phone-primary"
                            id="phone_number"
                            defaultCountry={defaultCountry}
                            placeholder="Enter phone number"
                            className={cn(errors.phone_number && "border-destructive")}
                        />
                    )}
                />
                {errors.phone_number && (
                    <p className="text-sm text-[#FF8A80]">{errors.phone_number.message}</p>
                )}
            </div>

            {/* Full-width field: Date of Birth */}
            <div className="space-y-1">
                <Label className="text-sm font-medium">Date of Birth</Label>
                <DatePickerWrapper
                    dob={dob}
                    setDob={(d) => setValue("dob", d)}
                />
            </div>

            {/* Full-width field: Secondary Email */}
            <div className="space-y-1">
                <Label htmlFor="secondary_email" className="text-sm font-medium">Secondary Email</Label>
                <Input
                    id="secondary_email"
                    type="email"
                    {...register("secondary_email")}
                    className={cn("h-12 md:h-10 text-base md:text-sm", errors.secondary_email && "border-destructive")}
                />
                {errors.secondary_email && (
                    <p className="text-sm text-[#FF8A80]">{errors.secondary_email.message}</p>
                )}
            </div>

            {/* Full-width field: Secondary Phone */}
            <div className="space-y-1">
                <Label htmlFor="secondary_phone" className="text-sm font-medium">Secondary Phone</Label>
                <Controller
                    name="secondary_phone"
                    control={control}
                    render={({ field }) => (
                        <PhoneInput
                            {...field}
                            key="yi-phone-secondary"
                            id="secondary_phone"
                            defaultCountry={defaultCountry}
                            placeholder="Enter secondary phone number"
                            className={cn(errors.secondary_phone && "border-destructive")}
                        />
                    )}
                />
                {errors.secondary_phone && (
                    <p className="text-sm text-[#FF8A80]">{errors.secondary_phone.message}</p>
                )}
            </div>
        </div>
    )
}

function DatePickerWrapper({ dob, setDob }: { dob: Date | undefined; setDob: (d: Date | undefined) => void }) {
    const [isMobile, setIsMobile] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    if (isMobile) {
        return (
            <input
                type="date"
                className="w-full h-12 rounded-lg px-3 bg-input text-foreground"
                value={dob ? format(dob, "yyyy-MM-dd") : ""}
                onChange={(e) => setDob(e.target.value ? new Date(e.target.value) : undefined)}
            />
        )
    }

    return (
        <div className="relative">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full h-12 justify-start text-left font-normal rounded-lg",
                            !dob && "text-muted-foreground",
                            open && "ring-2 ring-[#FF9933]"
                        )}
                        onClick={() => setOpen((v) => !v)}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dob ? format(dob, "dd/MM/yyyy") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="p-0 border-0 shadow-lg">
                    <div className="mt-2">
                        <Calendar
                            mode="single"
                            selected={dob}
                            onSelect={(date) => {
                                setDob(date)
                                setOpen(false)
                            }}
                            initialFocus
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
