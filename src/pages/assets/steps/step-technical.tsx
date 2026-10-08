import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Cog, Info, LocateFixed, Zap } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { StepCard } from "@/components/common/wizard"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { CategoryIcon } from "@/components/common/category-icon"
import { DateField, MeasureField, SelectField, TextareaField, TextField } from "@/components/form/fields"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { assetConditions, assetOperationalStatus, warrantyUnits, yesNo } from "@/data/master-data"
import { parametersFor, type ParamSpec } from "@/data/asset-parameters"
import type { AssetFormValues } from "@/pages/assets/schemas"

/**
 * Step 2 of 4: the ratings off the nameplate, and how the asset is run.
 *
 * The electrical specification is built from the asset type rather than being
 * one fixed form. An ACB is asked for a breaking capacity and a pole
 * configuration; a battery bank for its cell count and Ah rating; a solar
 * inverter for its DC input power. The parameters, their units, their option
 * lists and which of them are mandatory all come from the client's onboarding
 * sheet — see data/asset-parameters.ts.
 *
 * Asset criticality lives here now, as the client asked at review. It is the one
 * parameter every asset type carries, so it arrives with the rest of them.
 */
export function StepTechnical({ form }: { form: UseFormReturn<AssetFormValues> }) {
  const { control } = form
  const values = form.watch()
  const specs = parametersFor(values.category)
  const answers = values.parameters ?? {}

  const set = (key: string, value: string) =>
    form.setValue("parameters", { ...answers, [key]: value }, { shouldDirty: true })

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <StepCard
        title="Step 2 of 4: Technical Details"
        description="The ratings this kind of asset carries, and how it is run."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {/* ---------- Electrical specification, per asset type ---------- */}
          <Group icon={Zap} title="Electrical Specification">
            <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CategoryIcon category={values.category} className="size-4" />
              The parameters below are the ones a {values.category || "asset"} is registered with.
            </p>
            <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
              {specs.map((spec) => (
                <ParamField key={spec.key} spec={spec} value={answers[spec.key] ?? ""} onChange={set} />
              ))}
            </div>
          </Group>

          {/* ---------- Operational details ---------- */}
          <Group icon={Cog} title="Operational Details">
            <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
              <SelectField
                control={control}
                name="operationalStatus"
                label="Operational Status"
                required
                options={assetOperationalStatus}
              />
              <SelectField control={control} name="condition" label="Asset Condition" required options={assetConditions} />

              <TextField control={control} name="load" label="Current Load (kVA)" inputMode="decimal" placeholder="950" />
              <DateField control={control} name="commissioned" label="Commissioning Date" />

              <GpsCoordinates form={form} className="sm:col-span-2" />

              <MeasureField
                control={control}
                name="warranty"
                unitName="warrantyUnit"
                label="Warranty Period"
                units={warrantyUnits}
                placeholder="5"
              />
              <SelectField control={control} name="amc" label="AMC / Maintenance Contract" options={yesNo} />

              <DateField
                control={control}
                name="nextDue"
                label="Next Due Date (General Check)"
                fromYear={new Date().getFullYear()}
                toYear={new Date().getFullYear() + 10}
              />
              <div className="hidden sm:block" />

              <TextareaField
                control={control}
                name="remarks"
                label="Remarks"
                rows={2}
                maxLength={200}
                placeholder="Installed as part of the Phase-2 expansion."
                className="sm:col-span-2"
              />
            </div>
          </Group>
        </div>
      </StepCard>

      {/* ---------- What the ratings are being entered against ---------- */}
      <div className="space-y-3">
        <DetailPanel title="Asset Details">
          <DetailList
            rows={[
              { label: "Asset Name", value: values.tag, always: true },
              { label: "Category", value: values.category, always: true },
              { label: "Location / Area", value: values.area, always: true },
              { label: "Department", value: values.department },
              { label: "Sub-Department", value: values.subDepartment },
              { label: "Address", value: values.address },
              { label: "Plant", value: values.plant },
              { label: "Enterprise", value: values.enterprise },
            ]}
          />
        </DetailPanel>

        <p className="flex items-start gap-2 rounded-lg bg-info-soft p-3 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          Verify every rating against the asset nameplate before continuing. Photographs are captured in the next step.
        </p>
      </div>
    </div>
  )
}

/* ---------- Pieces ---------- */

/**
 * One parameter from the sheet.
 *
 * A Choice the sheet gives no option list for falls back to a text box rather
 * than to invented options — see `missingOptionLists` in data/asset-parameters.
 * These are not react-hook-form fields: the answers live in one `parameters`
 * map, so the form's shape does not have to change with the asset type.
 */
function ParamField({
  spec,
  value,
  onChange,
}: {
  spec: ParamSpec
  value: string
  onChange: (key: string, value: string) => void
}) {
  const label = (
    <FieldLabel htmlFor={spec.key} className="gap-1">
      {spec.label}
      {spec.required ? <span className="text-critical">*</span> : null}
    </FieldLabel>
  )

  if (spec.kind === "choice" && spec.options) {
    return (
      <Field>
        {label}
        <Select value={value} onValueChange={(v) => onChange(spec.key, v)}>
          <SelectTrigger id={spec.key} className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {spec.options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    )
  }

  return (
    <Field>
      {label}
      <div className="flex gap-1.5">
        <Input
          id={spec.key}
          value={value}
          inputMode={spec.kind === "number" ? "decimal" : undefined}
          onChange={(e) => onChange(spec.key, e.target.value)}
          className="min-w-0 flex-1"
        />
        {spec.unit ? (
          <span className="flex h-11 shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm whitespace-nowrap text-muted-foreground">
            {spec.unit}
          </span>
        ) : null}
      </div>
    </Field>
  )
}

/** One titled block of fields inside the step */
function Group({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg ring-1 ring-foreground/10">
      <h4 className="flex items-center gap-2 rounded-t-lg bg-info-soft px-3 py-2 text-base font-semibold text-brand-navy dark:text-foreground">
        <Icon className="size-5 text-primary" />
        {title}
      </h4>
      <div className="p-3">{children}</div>
    </section>
  )
}

/**
 * The asset's own coordinates.
 *
 * Optional, and pre-filled from the plant's registered location: every asset on
 * one site shares that pair until someone stands at the asset and captures a
 * reading. GPS is unreliable indoors, so a failed read leaves the plant's
 * figures in place rather than clearing the fields.
 */
function GpsCoordinates({ form, className }: { form: UseFormReturn<AssetFormValues>; className?: string }) {
  const [capturing, setCapturing] = useState(false)

  const capture = () => {
    if (!navigator.geolocation) {
      toast.error("This device cannot report its location.")
      return
    }
    setCapturing(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        form.setValue("latitude", coords.latitude.toFixed(4), { shouldDirty: true })
        form.setValue("longitude", coords.longitude.toFixed(4), { shouldDirty: true })
        setCapturing(false)
        toast.success("Coordinates captured at this asset.")
      },
      () => {
        setCapturing(false)
        toast.error("Could not get a fix. Indoors this often fails — the plant's coordinates have been kept.")
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  return (
    <div className={className}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">
          GPS Coordinates <span className="text-muted-foreground">(optional)</span>
        </span>
        <Button type="button" variant="outline" size="sm" onClick={capture} disabled={capturing}>
          <LocateFixed className={cn(capturing && "animate-pulse")} />
          {capturing ? "Capturing…" : "Capture at asset"}
        </Button>
      </div>
      <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
        <TextField control={form.control} name="latitude" label="Latitude" />
        <TextField control={form.control} name="longitude" label="Longitude" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Defaults to the plant's location until captured at the asset.</p>
    </div>
  )
}
