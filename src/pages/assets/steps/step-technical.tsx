import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Cog, Info, LocateFixed, Zap } from "lucide-react"
import { toast } from "sonner"

import { StepCard } from "@/components/common/wizard"
import { Button } from "@/components/ui/button"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { DateField, MeasureField, SelectField, TextareaField, TextField } from "@/components/form/fields"
import {
  assetConditions,
  assetOperationalStatus,
  coolingTypes,
  frequencyValues,
  insulationClasses,
  oilTypes,
  phaseTypes,
  powerUnits,
  tapChangerTypes,
  vectorGroups,
  voltageUnits,
  warrantyUnits,
  yesNo,
} from "@/data/master-data"
import type { AssetFormValues } from "@/pages/assets/schemas"

/**
 * Step 2 of 4: the ratings off the nameplate and how the asset is run.
 *
 * The mockup shows an "Asset Preview" panel on the right, built around a
 * photograph. Photographs are not taken until step 3, so there is nothing to
 * preview here — the panel shows the asset details entered in step 1 instead,
 * which is what the ratings being typed have to be checked against.
 *
 * Asset Criticality and Year of Manufacture appear on this step in the mockup as
 * well as on step 1. They are asked once, on step 1, and shown here read-only.
 *
 * "Location in Plant" is gone: the client confirmed it duplicated Location /
 * Area on step 1, which is the physical zone the asset is installed in.
 */
export function StepTechnical({ form }: { form: UseFormReturn<AssetFormValues> }) {
  const { control } = form
  const values = form.watch()

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <StepCard
        title="Step 2 of 4: Technical Details"
        description="Enter the technical specifications and operational details of the asset."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {/* ---------- Electrical specifications ---------- */}
          <Group icon={Zap} title="Electrical Specifications">
            <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
              <MeasureField
                control={control}
                name="primaryVoltage"
                required
                unitName="primaryVoltageUnit"
                label="Rated Voltage (Primary)"
                units={voltageUnits}
                placeholder="11"
              />
              <MeasureField
                control={control}
                name="secondaryVoltage"
                required
                unitName="secondaryVoltageUnit"
                label="Rated Voltage (Secondary)"
                units={voltageUnits}
                placeholder="415"
              />
              <MeasureField
                control={control}
                name="capacity"
                required
                unitName="capacityUnit"
                label="Rated Power / Capacity"
                units={powerUnits}
                placeholder="1600"
              />
              <SelectField control={control} name="frequency" label="Frequency" required options={frequencyValues} />
              <SelectField control={control} name="phase" label="Phase" required options={phaseTypes} />
              <SelectField control={control} name="cooling" label="Cooling Type" required options={coolingTypes} />
              <SelectField control={control} name="vectorGroup" label="Vector Group" options={vectorGroups} />
              <TextField control={control} name="impedance" label="Impedance (%)" inputMode="decimal" placeholder="6.25" />
              <SelectField control={control} name="insulation" label="Insulation Class" options={insulationClasses} />
              <SelectField control={control} name="tapChanger" label="Tap Changer" options={tapChangerTypes} />
              <SelectField control={control} name="oilType" label="Oil Type (if applicable)" options={oilTypes} className="sm:col-span-2" />
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

              <DateField control={control} name="nextDue" label="Next Due Date (General Check)" fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 10} />
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
              { label: "Asset Name / Tag ID", value: values.tag, always: true },
              { label: "Category", value: values.category, always: true },
              { label: "Location / Area", value: values.area, always: true },
              { label: "Department", value: values.department },
              { label: "Plant", value: values.plant },
              { label: "Enterprise", value: values.enterprise },
              { label: "Manufacturer", value: values.manufacturer },
              { label: "Model", value: values.model },
              { label: "Serial Number", value: values.serial },
              { label: "Year of Manufacture", value: values.year },
              { label: "Asset Criticality", value: values.criticality, always: true },
            ]}
          />
        </DetailPanel>

        <p className="flex items-start gap-2 rounded-lg bg-info-soft p-3 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          Verify every technical detail against the asset nameplate and the site documents before continuing. Photographs
          are captured in the next step.
        </p>
      </div>
    </div>
  )
}

/**
 * The asset's own coordinates.
 *
 * Optional, and pre-filled from the plant's registered location: every asset on
 * one site shares that pair until someone stands at the asset and captures a
 * reading, which is what Capture does. GPS is unreliable indoors, so a failed
 * read leaves the plant's figures in place rather than clearing the fields.
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
          <LocateFixed className={capturing ? "animate-pulse" : undefined} />
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
