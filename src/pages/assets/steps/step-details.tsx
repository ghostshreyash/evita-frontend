import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { LocateFixed } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { CategoryReference } from "@/components/assets/category-reference"
import { StepCard, TipBox } from "@/components/common/wizard"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SelectField, TextareaField, TextField } from "@/components/form/fields"
import { assetCategories } from "@/data/master-data"
import { buildAssetId, type siteFor } from "@/data/asset-data"
import { useAssetRows } from "@/data/asset-store"
import type { AssetFormValues } from "@/pages/assets/schemas"


/**
 * Step 1 of 4: where the asset sits and what it is.
 *
 * Ordered as the client asked at review: enterprise, plant, then the department
 * tree — both levels optional — then the location, which is free text rather
 * than a list because no two plants name their rooms and bays alike. Serial
 * number, year of manufacture and installation date are gone from this step;
 * the onboarding sheet does not ask for them, and what it does ask depends on
 * the asset type, so the make and model moved to step 2 with the rest of the
 * specification. Asset criticality moved there too.
 */
export function StepDetails({
  form,
  site,
}: {
  form: UseFormReturn<AssetFormValues>
  site: ReturnType<typeof siteFor>
}) {
  const { control, setValue } = form
  const register = useAssetRows()
  const departments = site.plant.departments.map((d) => d.name)
  const category = form.watch("category")
  const department = form.watch("department")

  const subDepartments =
    site.plant.departments.find((d) => d.name === department)?.subDepartments.map((sd) => sd.name) ?? []

  /*
   * The Asset ID is the platform's, not the engineer's, so it is shown filled in
   * and read-only. Everything it is built from is on this step, so what is shown
   * here is the id the asset is actually registered under.
   */
  const assetId = category
    ? buildAssetId({ enterprise: site.enterprise, city: site.plant.city, category, existing: register })
    : ""

  /* A category typed by hand behind Other is not on the master list */
  const categoryOptions =
    category && !(assetCategories as readonly string[]).includes(category)
      ? [...assetCategories, category]
      : assetCategories

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <StepCard title="Step 1 of 4: Asset Details" description="Where the asset sits, and what it is.">
        <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
          {/* Posting, not a choice: EVITA registers assets at the engineer's own site */}
          <TextField control={control} name="enterprise" label="Enterprise" required readOnly />
          <TextField control={control} name="plant" label="Plant" required readOnly />

          <SelectField
            control={control}
            name="department"
            label="Department"
            options={departments}
            placeholder="Select (optional)"
            // The sub-department belonged to the old department; it cannot survive the change
            onValueChange={() => setValue("subDepartment", "", { shouldDirty: true })}
          />
          <SelectField
            control={control}
            name="subDepartment"
            label="Sub-Department"
            options={subDepartments}
            disabled={subDepartments.length === 0}
            placeholder={department ? (subDepartments.length ? "Select (optional)" : "None under this department") : "Choose a department first"}
          />

          {/* Free text, not a list: no two plants name their rooms and bays alike */}
          <TextareaField
            control={control}
            name="area"
            label="Location / Area"
            required
            rows={2}
            maxLength={200}
            placeholder="Main Substation (11kV), Block A — whatever gets the next engineer to it"
            className="sm:col-span-2"
          />

          {/* The grid on the right fills this in too — it is the faster way on a tablet */}
          <SelectField
            control={control}
            name="category"
            label="Asset Category"
            required
            options={categoryOptions}
            placeholder="Select, or tap a category on the right"
          />

          <TextField
            control={control}
            name="tag"
            label="Asset Name"
            required
            placeholder="TRF-T1-11KV"
            description="What the plant calls it on the panel door"
          />

          <Field>
            <FieldLabel htmlFor="asset-id">Asset ID</FieldLabel>
            <Input
              id="asset-id"
              readOnly
              value={assetId}
              placeholder="Pick a category and this fills in"
              className="font-semibold text-primary tabular-nums"
            />
            <FieldDescription>Generated by the platform. Not editable, and never reused.</FieldDescription>
          </Field>

          <TextareaField
            control={control}
            name="description"
            label="Asset Description"
            rows={2}
            maxLength={200}
            placeholder="11kV/415V Distribution Transformer - T1"
            className="sm:col-span-2"
          />

          <GpsCoordinates form={form} className="sm:col-span-2" />
        </div>
      </StepCard>

      <div className="space-y-3">
        <CategoryReference
          value={category}
          onSelect={(value) => setValue("category", value, { shouldValidate: true, shouldDirty: true })}
        />
        <TipBox
          items={[
            "Pick the category first — it decides which ratings step 2 asks for.",
            "Location / Area is free text: name the room, bay or yard the asset stands in.",
            "Ensure the asset is correctly identified before onboarding.",
            "Capture clear photos of the nameplate and the overall equipment.",
            "All fields marked * are mandatory.",
          ]}
        />
      </div>
    </div>
  )
}

/**
 * The asset's own coordinates.
 *
 * Optional, as the client confirmed, and pre-filled from the plant's registered
 * location: every asset on one site shares that pair until someone stands at
 * the asset and captures a reading. GPS is unreliable indoors, so a failed read
 * leaves the plant's figures in place rather than clearing the fields.
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
