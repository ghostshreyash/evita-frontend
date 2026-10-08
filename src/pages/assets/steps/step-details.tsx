import type { UseFormReturn } from "react-hook-form"

import { CategoryReference } from "@/components/assets/category-reference"
import { StepCard, TipBox } from "@/components/common/wizard"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SelectField, TextareaField, TextField } from "@/components/form/fields"
import { assetCategories } from "@/data/master-data"
import { buildAssetId, type siteFor } from "@/data/asset-data"
import { useAssetRows } from "@/data/asset-store"
import type { AssetFormValues } from "@/pages/assets/schemas"

/**
 * Areas inside a plant an asset can be registered against — the electrical rooms
 * an engineer actually walks, which is not the same thing as the plant's
 * department tree. An asset lives in a room and is owned by a department.
 */
const areas = [
  "Main Substation (11kV)",
  "LT Panel Room - Block A",
  "DG Set Area",
  "Production Floor",
  "Utility Area",
  "Cable Trench",
  "Compressor House",
  "Water Treatment Plant",
]

/**
 * Step 1 of 4: where the asset sits and what it is.
 *
 * Ordered as the client asked at review: enterprise, plant, then the department
 * tree — both levels optional — then the address. Serial number, year of
 * manufacture and installation date are gone from this step; the onboarding
 * sheet does not ask for them, and what it does ask depends on the asset type,
 * so the make and model moved to step 2 with the rest of the specification.
 * Asset criticality moved there too.
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

          <TextareaField
            control={control}
            name="address"
            label="Address"
            rows={2}
            maxLength={200}
            placeholder="Building, floor, bay — whatever gets the next engineer to it"
            className="sm:col-span-2"
          />

          <SelectField control={control} name="area" label="Location / Area" required options={areas} />

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
            "Ensure the asset is correctly identified before onboarding.",
            "Capture clear photos of the nameplate and the overall equipment.",
            "All fields marked * are mandatory.",
          ]}
        />
      </div>
    </div>
  )
}
