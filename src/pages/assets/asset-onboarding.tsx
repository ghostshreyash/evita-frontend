import { useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { StepperBar } from "@/components/common/wizard"
import { Button } from "@/components/ui/button"
import { siteFor } from "@/data/asset-data"
import { onboardAsset, updateAsset, useAssetRows, valuesFrom } from "@/data/asset-store"
import type { AssetRecord } from "@/data/asset-data"
import { useCurrentElpremar } from "@/lib/me"
import { assetSchema, missingUploads, stepFields, type AssetFormValues } from "@/pages/assets/schemas"
import { missingParameters } from "@/data/asset-parameters"
import { StepDetails } from "@/pages/assets/steps/step-details"
import { StepTechnical } from "@/pages/assets/steps/step-technical"
import { StepUploads } from "@/pages/assets/steps/step-uploads"
import { StepReview } from "@/pages/assets/steps/step-review"
import { AssetIdScreen } from "@/pages/assets/asset-id"

const steps = [
  { title: "Asset Details" },
  { title: "Technical Details" },
  { title: "Images & Documents" },
  { title: "Review & Submit" },
]

/**
 * Asset onboarding, slides 16–20 of the EVITA workflow.
 *
 * All four steps share one form, so stepping back to change an earlier answer
 * never discards a later one. Submitting registers the asset and hands over to
 * the Asset ID & QR screen, which is the fifth view of the same route rather
 * than a separate page — there is nothing to link to until the asset exists.
 *
 * The same four steps correct an asset already on the register, opened from
 * `/assets/:id/edit` and filled in with what it holds. The Asset ID is not
 * reissued — see `updateAsset` — so a correction ends back on the asset rather
 * than on the Asset ID screen.
 */
export function AssetOnboardingPage() {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const site = useMemo(() => siteFor(me.id), [me])

  /*
   * Opened from a scheduled visit, the wizard already knows where the engineer
   * is standing: the area comes from the visit, and finishing goes back to it
   * so the asset just registered can be inspected without hunting for it.
   */
  const [params] = useSearchParams()
  const fromVisit = params.get("visit")
  const atArea = params.get("area") ?? ""

  /* Correcting an asset rather than registering one, if the route names one */
  const { id: editing } = useParams()
  const register = useAssetRows()
  const asset = useMemo(() => (editing ? register.find((a) => a.id === editing) : undefined), [register, editing])
  const held = useMemo(() => (asset ? valuesFrom(asset) : undefined), [asset])

  const [current, setCurrent] = useState(0)
  /*
   * How far the stepper can jump. Registering an asset walks forward one step
   * at a time, each validated before it is left, so nothing half-filled reaches
   * the review. Correcting one that is already on the register is different:
   * every answer is there, and the engineer came to change one of them - so the
   * whole bar is live from the start.
   */
  const [furthest, setFurthest] = useState(0)
  const [pending, setPending] = useState(false)
  /** Set once the asset is registered; switches the route to the Asset ID screen */
  const [created, setCreated] = useState<AssetRecord>()

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    mode: "onTouched",
    defaultValues: held ?? {
      // The engineer's own posting, which is the only site EVITA registers assets at
      enterprise: site.enterprise,
      plant: site.plant.name,
      department: site.department,
      subDepartment: "",
      area: atArea,
      category: "",
      tag: "",
      description: "",
      /* Filled in per asset type on step 2 - see data/asset-parameters.ts */
      parameters: {},
      environment: "",

      // Pre-filled from the plant's own registered location, and editable on site
      latitude: site.plant.latitude,
      longitude: site.plant.longitude,

      images: [],
      documents: [],
    },
  })

  const goTo = (step: number) => {
    setCurrent(step)
    setFurthest((f) => Math.max(f, step))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const next = async () => {
    const ok = await form.trigger(stepFields[current])
    if (!ok) {
      toast.error("Check the highlighted fields before continuing.")
      return
    }
    if (current === 1) {
      const values = form.getValues()
      const owed = missingParameters(values.category, values.parameters ?? {})
      if (owed.length) {
        toast.error(`Still needed: ${owed.map((p) => p.label).join(", ")}.`)
        return
      }
    }
    if (current === 2) {
      const missing = missingUploads(form.getValues())
      if (!missing.complete) {
        toast.error(
          missing.images === 0
            ? "Add at least one photograph of the asset."
            : "Every photograph and document needs a name."
        )
        return
      }
    }
    goTo(current + 1)
  }

  const submit = form.handleSubmit((values) => {
    setPending(true)
    if (asset) {
      const record = updateAsset(asset.id, values)
      setPending(false)
      toast.success(`${asset.id} corrected. It will reach the server at the next sync.`)
      navigate(`/assets/${record?.id ?? asset.id}`)
      return
    }
    const { record, inspection } = onboardAsset(values, { city: site.plant.city }, me.name)
    setPending(false)
    /* The asset owes an inspection, and it is already on the book - see onboardAsset */
    toast.success(`${record.id} registered`, {
      description: `${inspection} raised against it, ready to start.`,
    })
    /* Back to the visit it was registered on, where it can now be inspected */
    if (fromVisit) {
      navigate(`/visits/${fromVisit}`)
      return
    }
    setCreated(record)
    window.scrollTo({ top: 0, behavior: "smooth" })
  })

  // Once the asset exists, the wizard is finished and its result takes the page
  if (created) {
    return (
      <AssetIdScreen
        asset={created}
        onRestart={() => {
          form.reset()
          setCreated(undefined)
          setCurrent(0)
          setFurthest(0)
        }}
        onDone={() => navigate(`/assets/${created.id}`)}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={asset ? `Correct ${asset.id}` : "Asset Onboarding"}
        description={
          asset
            ? "Put right anything that was entered wrongly. The Asset ID stays as it was issued — it is printed on the label and quoted by every inspection taken against this asset."
            : "Register new electrical assets at the assigned location for preventive maintenance and reliability management."
        }
        breadcrumbs={
          asset
            ? [{ label: "Assets", to: "/assets" }, { label: asset.id, to: `/assets/${asset.id}` }, { label: "Correct" }]
            : [{ label: "Assets", to: "/assets" }, { label: "Asset Onboarding" }]
        }
      />

      <StepperBar steps={steps} current={current} furthest={asset ? steps.length - 1 : furthest} onSelect={goTo} />

      {current === 0 ? <StepDetails form={form} site={site} /> : null}
      {current === 1 ? <StepTechnical form={form} /> : null}
      {current === 2 ? <StepUploads form={form} /> : null}
      {current === 3 ? <StepReview form={form} onEdit={goTo} /> : null}

      {/* ---------- Footer, shared by every step ---------- */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {current === 0 ? (
          <Button variant="outline" onClick={() => navigate("/assets")} disabled={pending}>
            Cancel
          </Button>
        ) : (
          <Button variant="outline" onClick={() => goTo(current - 1)} disabled={pending}>
            <ArrowLeft /> Back
          </Button>
        )}

        {current < steps.length - 1 ? (
          <Button onClick={next} className="min-w-32">
            Next <ArrowRight />
          </Button>
        ) : (
          <Button onClick={submit} className="min-w-56" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" /> Registering…
              </>
            ) : (
              <>
                Submit Asset for Onboarding <Check />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
