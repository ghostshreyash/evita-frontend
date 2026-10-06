import type { UseFormReturn } from "react-hook-form"
import { Cog, Info, Zap } from "lucide-react"

import { StepCard } from "@/components/common/wizard"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { DateField, MeasureField, SelectField, TextareaField, TextField } from "@/components/form/fields"
import {
  assetConditions,
  assetLocationsInPlant,
  coolingTypes,
  frequencyUnits,
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
                unitName="primaryVoltageUnit"
                label="Rated Voltage (Primary)"
                required
                units={voltageUnits}
                placeholder="11"
              />
              <MeasureField
                control={control}
                name="secondaryVoltage"
                unitName="secondaryVoltageUnit"
                label="Rated Voltage (Secondary)"
                required
                units={voltageUnits}
                placeholder="415"
              />
              <MeasureField
                control={control}
                name="capacity"
                unitName="capacityUnit"
                label="Rated Power / Capacity"
                required
                units={powerUnits}
                placeholder="1600"
              />
              <MeasureField
                control={control}
                name="frequency"
                unitName="frequencyUnit"
                label="Frequency"
                required
                units={frequencyUnits}
                placeholder="50"
              />
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
              <SelectField control={control} name="condition" label="Asset Condition" required options={assetConditions} />
              <DateField control={control} name="commissioned" label="Commissioning Date" />

              <TextField control={control} name="load" label="Current Load (kVA)" inputMode="decimal" placeholder="950" />
              <SelectField
                control={control}
                name="locationInPlant"
                label="Location in Plant"
                required
                options={assetLocationsInPlant}
              />

              <TextField control={control} name="latitude" label="Latitude" description="Pre-filled from the plant" />
              <TextField control={control} name="longitude" label="Longitude" description="Adjust at the asset" />

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
