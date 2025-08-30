"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import * as RPNInput from "react-phone-number-input"
import { isValidPhoneNumber, isPossiblePhoneNumber } from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import 'react-phone-number-input/style.css'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandGroup, CommandEmpty, CommandItem } from "@/components/ui/command"
// `ScrollArea` component may not exist in all projects; provide a lightweight
// fallback that renders a native div with overflow for the country list.
const ScrollArea: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>> = React.forwardRef(
  (props, ref) => <div ref={ref as any} {...props} />
)
import { CheckIcon, ChevronsUpDown } from "lucide-react"

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void
    // When true, show inline validation errors as the user types. Default: false
    showErrors?: boolean
  }

// Flag component that renders inline svg from flags map
const FlagComponent = ({ country, countryName }: RPNInput.FlagProps & { countryName?: string }) => {
  const Flag = (flags as any)[country]
  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  )
}

type LocalInputProps = React.ComponentProps<"input"> & { $variantBg?: boolean }
const InputComponent = React.forwardRef<HTMLInputElement, LocalInputProps>(({ className, $variantBg, ...props }, ref) => (
  <Input
    className={cn("rounded-e-lg rounded-s-none", $variantBg ? "bg-white/10" : "bg-white/0", className)}
    {...props}
    ref={ref}
  />
))
InputComponent.displayName = "InputComponent"

// Stable wrapper for the library input component. Declared at module scope so
// its identity doesn't change between renders (avoids remounts which cause
// input focus to drop). It computes $variantBg from the passed props value.
const InputWrapper = React.forwardRef<HTMLInputElement, any>((p, r) => (
  <InputComponent {...p} $variantBg={!!(p && p.value)} ref={r} />
))
InputWrapper.displayName = "PhoneInputWrapper"

// Country select - simplified version using Command / ScrollArea
const CountrySelect = ({ disabled, value: selectedCountry, options, onChange }: any) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const [searchValue, setSearchValue] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover
      open={isOpen}
      modal
      onOpenChange={(open) => {
        setIsOpen(open)
        open && setSearchValue("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 h-11 text-sm focus:z-10"
          disabled={disabled}
        >
          <FlagComponent country={selectedCountry} countryName={selectedCountry} />
          <ChevronsUpDown className={cn("-mr-2 size-4 opacity-50", disabled ? "hidden" : "opacity-100")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={(v: string) => {
              setSearchValue(v)
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
                  if (viewportElement) viewportElement.scrollTop = 0
                }
              }, 0)
            }}
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt: any) =>
                  opt && opt.value ? (
                    <CommandItem
                      key={opt.value}
                      onSelect={() => {
                        // Call the library onChange after a short delay while the
                        // popover/command UI is still mounted so any internal
                        // focus calls succeed, then close the popover.
                        setTimeout(() => {
                          try {
                            onChange(opt.value)
                          } catch (e) {
                            // Swallow focus-race errors which may still occur in
                            // some browser / library timing edge cases.
                          }
                          setIsOpen(false)
                        }, 50)
                      }}
                      className="gap-2"
                    >
                      <FlagComponent country={opt.value} countryName={opt.label} />
                      <span className="flex-1 text-sm">{opt.label}</span>
                      <span className="text-sm text-foreground/50">+{RPNInput.getCountryCallingCode(opt.value)}</span>
                      <CheckIcon className={`ml-auto size-4 ${opt.value === selectedCountry ? "opacity-100" : "opacity-0"}`} />
                    </CommandItem>
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type PhoneInputHandle = { validate: () => boolean }

const PhoneInput = React.forwardRef<any, PhoneInputProps>(({ className, onChange, value, showErrors, ...props }, ref) => {
  // local error state
  const [error, setError] = React.useState<string | null>(null)

  // coerce undefined to empty string so parent state doesn't receive undefined
  const emitValue = (v?: RPNInput.Value | string) => {
    const out: RPNInput.Value = (v === undefined || v === null || v === "") ? ("" as RPNInput.Value) : (v as RPNInput.Value)
    onChange?.(out)
  }

  // handle change from library, enforce Spain national length when country +34
  const handleChange = (v?: RPNInput.Value) => {
    // Reset visible error only when showErrors is true; otherwise keep silent
    if (showErrors) setError(null)
    if (!v) {
      emitValue("")
      return
    }

    // numeric digits only
    const cleaned = String(v).replace(/\D/g, "") // e.g., '34600123456'

    // No country-specific trimming here: rely on the react-phone-number-input
    // validators (isPossiblePhoneNumber / isValidPhoneNumber) to handle per-country rules.

    // Validate possibilities / validity
    try {
      const possible = isPossiblePhoneNumber(String(v))
      const valid = isValidPhoneNumber(String(v))
      if (showErrors) {
        if (!possible) {
          setError("Número de telèfon massa curt o no plausible")
        } else if (!valid) {
          setError("Número de telèfon invàlid")
        } else {
          setError(null)
        }
      }
    } catch (e) {
      if (showErrors) setError("Número de telèfon no vàlid")
    }

    emitValue(v)
  }

    // Expose a validate() method (and a focus helper) to parent via ref so
    // parent can trigger validation on submit/next. We keep the internal
    // input ref private to avoid focus races, but allow focusing via this
    // handle which delegates to the internal ref when available.
    React.useImperativeHandle(ref, () => ({
      validate: () => {
        const val = value || ""
        if (!val || String(val).trim() === "") return true
        try {
          if (!isPossiblePhoneNumber(String(val))) {
            setError("Número de telèfon massa curt o no plausible")
            return false
          }
          if (!isValidPhoneNumber(String(val))) {
            setError("Número de telèfon invàlid")
            return false
          }
          setError(null)
          return true
        } catch (e) {
          setError("Número de telèfon no vàlid")
          return false
        }
      },
      focus: () => {
        try {
          internalInputRef.current?.focus()
        } catch (e) {
          // ignore
        }
      }
    }))

  // build localized country list for selector (not used directly but kept for compatibility)
  const countries = RPNInput.getCountries().map((c) => ({ value: c, label: c }))

  // Use an internal ref for the underlying input so we don't pass the
  // forwarded ref directly into the library component. This avoids a timing
  // / remount issue where the wrapped input would lose focus after every
  // controlled update. We still expose validate() and focus() through the
  // forwarded ref below.
  const internalInputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <div className="w-full">

      <RPNInput.default
        // Give the library a stable internal ref (not the forwarded ref) so
        // it can control focus without racing with parent refs.
        ref={internalInputRef as any}
        className={cn("flex w-full", className)}
        flagComponent={FlagComponent as any}
        countrySelectComponent={CountrySelect as any}
        inputComponent={InputWrapper as any}
        smartCaret={false}
        defaultCountry="ES"
        value={value || undefined}
        onChange={handleChange}
        maxLength={20}
        {...props}
      />
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  )
})

PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
export default PhoneInput
