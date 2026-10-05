import { useState } from "react"
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { Calendar as CalendarIcon, Eye, EyeOff, UploadCloud, X} from "lucide-react"
import { format, isValid, parseISO } from "date-fns"
import { cn } from "cn"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dialCodes } from "@/data/master-data"

type BaseProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
  description?: string
  className?: string
  startIcon?: React.ReactNode
  inputClassName?: string
  clearable?: boolean
}

function FieldTitle({ label, required, htmlFor }: { label: string; required?: boolean; htmlFor: string }) {
  return (
    <FieldLabel htmlFor={htmlFor} className="gap-1">
      {label}
      {required ? <span className="text-critical">*</span> : null}
    </FieldLabel>
  )
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  className,
  startIcon,
  inputClassName,
  clearable,
  onValueChange,
  ...inputProps
}: BaseProps<T> &
  Omit<React.ComponentProps<typeof Input>, "name"> & {
    /** Runs after the value changes - used to fill dependent fields */
    onValueChange?: (value: string) => void
  }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <div className="relative">
            {startIcon ? <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground [&>svg]:size-5">{startIcon}</span> : null}
            <Input
              id={name}
              aria-invalid={fieldState.invalid}
              className={cn(startIcon && "pl-10", clearable && "pr-11", inputClassName)}
              {...inputProps}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => {
                field.onChange(e)
                onValueChange?.(e.target.value)
              }}
            />
            {clearable && field.value ? (
              <button
                type="button"
                aria-label={`Clear ${label}`}
                onClick={() => field.onChange("")}
                className="absolute top-1/2 right-0.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function PasswordField<T extends FieldValues>(props: BaseProps<T> & { placeholder?: string }) {
  const [visible, setVisible] = useState(false)
  const { control, name, label, required, description, className, placeholder, startIcon, inputClassName } = props
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <div className="relative">
            {startIcon ? <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground [&>svg]:size-5">{startIcon}</span> : null}
            <Input
              id={name}
              type={visible ? "text" : "password"}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
              className={cn("pr-12", startIcon && "pl-10", inputClassName)}
              {...field}
              value={field.value ?? ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  maxLength = 500,
  rows = 4,
  placeholder,
}: BaseProps<T> & { maxLength?: number; rows?: number; placeholder?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <Textarea
            id={name}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            {...field}
            value={field.value ?? ""}
          />
          <div className="text-right text-xs text-muted-foreground">
            {(field.value ?? "").length}/{maxLength}
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  options,
  placeholder = "Select",
  disabled,
  onValueChange,
}: BaseProps<T> & {
  options: readonly string[]
  placeholder?: string
  disabled?: boolean
  /** Runs after the value changes - used to clear a dependent field */
  onValueChange?: (value: string) => void
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <Select
            value={field.value ?? ""}
            disabled={disabled}
            onValueChange={(v) => {
              field.onChange(v)
              onValueChange?.(v)
            }}
          >
            <SelectTrigger id={name} aria-invalid={fieldState.invalid} className="w-full" onBlur={field.onBlur}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

/**
 * A measured value with its unit beside it — 1600 kVA, 11 kV, 5 Years.
 *
 * The number and the unit are separate form fields under one label, so the
 * number stays clean for validation and arithmetic while the unit travels with
 * it. A single-option unit renders as a plain suffix rather than a select the
 * engineer has to open to confirm what it already says.
 */
export function MeasureField<T extends FieldValues>({
  control,
  name,
  unitName,
  label,
  required,
  className,
  units,
  placeholder,
  inputMode = "decimal",
}: BaseProps<T> & {
  unitName: FieldPath<T>
  units: readonly string[]
  placeholder?: string
  inputMode?: "decimal" | "numeric"
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <div className="flex gap-1.5">
            <Input
              {...field}
              id={name}
              inputMode={inputMode}
              placeholder={placeholder}
              value={field.value ?? ""}
              aria-invalid={fieldState.invalid}
              className="min-w-0 flex-1"
            />
            <Controller
              control={control}
              name={unitName}
              render={({ field: unitField }) =>
                units.length === 1 ? (
                  <span className="flex h-11 shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                    {units[0]}
                  </span>
                ) : (
                  <Select value={unitField.value ?? ""} onValueChange={unitField.onChange}>
                    <SelectTrigger aria-label={`${label} unit`} className="w-24 shrink-0">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }
            />
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

/**
 * Phone number with a dialling-code select in front. The code and the number are
 * separate form fields, so the number stays clean for validation and storage.
 */
export function PhoneField<T extends FieldValues>({
  control,
  codeName,
  name,
  label,
  required,
  className,
  placeholder = "98765 43210",
}: BaseProps<T> & { codeName: FieldPath<T>; placeholder?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <div className="flex gap-1.5">
            <Controller
              control={control}
              name={codeName}
              render={({ field: codeField }) => (
                <Select value={codeField.value ?? ""} onValueChange={codeField.onChange}>
                  <SelectTrigger aria-label="Country dialling code" className="w-20 shrink-0">
                    <SelectValue placeholder="+91" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" avoidCollisions={false}>
                    {dialCodes.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        <span className="tabular-nums">{d.code}</span>
                        <span className="text-muted-foreground">{d.country}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Input
              {...field}
              id={name}
              type="tel"
              inputMode="tel"
              value={field.value ?? ""}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
            />
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

/**
 * Calendar-backed date picker. Stores an ISO date string (yyyy-MM-dd) in form
 * state so it serialises cleanly, while showing a readable date to the user.
 */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  placeholder = "Select date",
  fromYear = new Date().getFullYear() - 60,
  toYear = new Date().getFullYear(),
}: BaseProps<T> & { placeholder?: string; fromYear?: number; toYear?: number }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = field.value ? parseISO(String(field.value)) : undefined
        const valid = selected && isValid(selected)
        return (
          <Field data-invalid={fieldState.invalid} className={className}>
            <FieldTitle label={label} required={required} htmlFor={name} />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={name}
                  type="button"
                  variant="outline"
                  aria-invalid={fieldState.invalid}
                  onBlur={field.onBlur}
                  className={cn("w-full justify-between font-normal", !valid && "text-muted-foreground")}
                >
                  {valid ? format(selected, "dd MMM yyyy") : placeholder}
                  <CalendarIcon className="size-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  startMonth={new Date(fromYear, 0)}
                  endMonth={new Date(toYear, 11)}
                  selected={valid ? selected : undefined}
                  defaultMonth={valid ? selected : new Date(toYear, 0)}
                  onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                />
              </PopoverContent>
            </Popover>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}

/** Drag-and-drop style file picker (PNG/JPG logos, photos). Keeps the chosen File in form state. */
export function FileDropField<T extends FieldValues>({
  control,
  name,
  label,
  className,
  hint = "PNG, JPG (Max 2 MB)",
  accept = "image/png,image/jpeg",
}: BaseProps<T> & { hint?: string; accept?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const file = field.value as File | undefined
        return (
          <Field className={className}>
            <FieldTitle label={label} htmlFor={name} />
            <label
              htmlFor={name}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent"
              )}
            >
              <UploadCloud className="size-8 text-primary" />
              {file ? (
                <span className="font-medium text-foreground">{file.name}</span>
              ) : (
                <>
                  <span>Drag &amp; drop file here</span>
                  <span className="text-xs">or</span>
                  <span className="rounded-md border bg-card px-3 py-1 font-medium text-foreground">Choose File</span>
                </>
              )}
              <input
                id={name}
                type="file"
                accept={accept}
                className="sr-only"
                onChange={(e) => field.onChange(e.target.files?.[0])}
              />
            </label>
            <FieldDescription className="text-xs">{hint}</FieldDescription>
          </Field>
        )
      }}
    />
  )
}
