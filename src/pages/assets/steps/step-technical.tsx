import type { UseFormReturn } from "react-hook-form"
import { Info } from "lucide-react"

import { StepCard } from "@/components/common/wizard"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { CategoryIcon } from "@/components/common/category-icon"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { parametersFor, unitFor, unitKeyOf, type ParamSpec } from "@/data/asset-parameters"
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
 *
 * There is no operational block any more. Asset condition, current load,
 * warranty, AMC, the next general check, operational status and the
 * commissioning date are not asked for by the onboarding sheet, and the asset's
 * own coordinates moved to step 1 with the rest of its location.
 */
export function StepTechnical({ form }: { form: UseFormReturn<AssetFormValues> }) {
  const values = form.watch()
  const specs = parametersFor(values.category)
  const answers = values.parameters ?? {}

  const set = (key: string, value: string) =>
    form.setValue("parameters", { ...answers, [key]: value }, { shouldDirty: true })

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <StepCard
        title="Step 2 of 4: Technical Details"
        description="The electrical specification this kind of asset is registered with."
      >
        <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CategoryIcon category={values.category} className="size-4" />
          The parameters below are the ones a {values.category || "asset"} is registered with.
        </p>
        <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          {specs.map((spec) => (
            <ParamField key={spec.key} spec={spec} answers={answers} onChange={set} />
          ))}
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
 * Units are always picked, never typed: the sheet writes several of them as
 * alternatives, so the engineer says which one the nameplate uses.
 *
 * These are not react-hook-form fields: the answers live in one `parameters`
 * map, so the form's shape does not have to change with the asset type.
 */
function ParamField({
  spec,
  answers,
  onChange,
}: {
  spec: ParamSpec
  answers: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const value = answers[spec.key] ?? ""
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
        {spec.units ? (
          <Select value={unitFor(spec, answers)} onValueChange={(v) => onChange(unitKeyOf(spec), v)}>
            <SelectTrigger aria-label={`${spec.label} unit`} className="w-auto shrink-0 gap-1 bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {spec.units.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </Field>
  )
}
