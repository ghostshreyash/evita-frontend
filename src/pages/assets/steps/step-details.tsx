import type { UseFormReturn } from "react-hook-form"

import { CategoryReference } from "@/components/assets/category-reference"
import { StepCard, TipBox } from "@/components/common/wizard"
import { DateField, SelectField, TextareaField, TextField } from "@/components/form/fields"
import { assetCategories, assetCriticality, manufacturers } from "@/data/master-data"
import type { siteFor } from "@/data/asset-data"
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
 * Step 1 of 4: who owns the asset, where it sits and what it is.
 *
 * The mockup carries a "Recently Onboarded Assets at This Location" table under
 * the form. It is not here: the register at /assets already answers that, and
 * repeating it mid-form only invites the engineer to leave the wizard.
 */
export function StepDetails({
  form,
  site,
}: {
  form: UseFormReturn<AssetFormValues>
  site: ReturnType<typeof siteFor>
}) {
  const { control, setValue } = form
  const departments = site.plant.departments.map((d) => d.name)
  const category = form.watch("category")

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <StepCard title="Step 1 of 4: Asset Details" description="Enter the basic information of the electrical asset.">
        <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
          {/* Posting, not a choice: EVITA registers assets at the engineer's own site */}
          <TextField control={control} name="enterprise" label="Enterprise" required readOnly />
          <TextField control={control} name="plant" label="Plant" required readOnly />

          <SelectField control={control} name="area" label="Location / Area" required options={areas} />
          <SelectField control={control} name="department" label="Department" required options={departments} />

          {/* The grid on the right fills this in too — it is the faster way on a tablet */}
          <SelectField
            control={control}
            name="category"
            label="Asset Category"
            required
            options={assetCategories}
            placeholder="Select, or tap a category on the right"
          />
          <TextField control={control} name="tag" label="Asset Name / Tag ID" required placeholder="TRF-T1-11KV" />

          <TextareaField
            control={control}
            name="description"
            label="Asset Description"
            rows={2}
            maxLength={200}
            placeholder="11kV/415V Distribution Transformer - T1"
            className="sm:col-span-2"
          />

          <SelectField control={control} name="manufacturer" label="Manufacturer" options={manufacturers} />
          <TextField control={control} name="model" label="Model" placeholder="CRGT-TR-11/0.415" />

          <TextField control={control} name="serial" label="Serial Number" placeholder="CG-TR-2021-4587" />
          <TextField control={control} name="year" label="Year of Manufacture" inputMode="numeric" placeholder="2021" />

          <DateField control={control} name="installed" label="Installation Date" />
          <SelectField control={control} name="criticality" label="Asset Criticality" required options={assetCriticality} />
        </div>
      </StepCard>

      <div className="space-y-3">
        <CategoryReference
          value={category}
          onSelect={(value) => setValue("category", value, { shouldValidate: true, shouldDirty: true })}
        />
        <TipBox
          items={[
            "Ensure the asset is correctly identified before onboarding.",
            "Capture clear photos of the nameplate and the overall equipment.",
            "Use the correct Asset Category so maintenance is planned against the right schedule.",
            "All fields marked * are mandatory.",
          ]}
        />
      </div>
    </div>
  )
}
