import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { StepperBar } from "@/components/common/wizard"
import { Button } from "@/components/ui/button"
import { siteFor } from "@/data/asset-data"
import { onboardAsset } from "@/data/asset-store"
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
 */
export function AssetOnboardingPage() {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const site = useMemo(() => siteFor(me.id), [me])

  const [current, setCurrent] = useState(0)
  const [furthest, setFurthest] = useState(0)
  const [pending, setPending] = useState(false)
  /** Set once the asset is registered; switches the route to the Asset ID screen */
  const [created, setCreated] = useState<AssetRecord>()

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    mode: "onTouched",
    defaultValues: {
      // The engineer's own posting, which is the only site EVITA registers assets at
      enterprise: site.enterprise,
      plant: site.plant.name,
      department: site.department,
      subDepartment: "",
      area: "",
      category: "",
      tag: "",
      description: "",
      /* Filled in per asset type on step 2 - see data/asset-parameters.ts */
      parameters: {},

      // Pre-filled from the plant's own registered location, and editable on site
      latitude: site.plant.latitude,
      longitude: site.plant.longitude,

      operationalStatus: "",
      commissioned: "",

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
    const record = onboardAsset(values, { city: site.plant.city })
    setPending(false)
    setCreated(record)
    window.scrollTo({ top: 0, behavior: "smooth" })
    toast.success(`${record.id} registered. It will reach the server at the next sync.`)
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
        title="Asset Onboarding"
        description="Register new electrical assets at the assigned location for preventive maintenance and reliability management."
        breadcrumbs={[{ label: "Assets", to: "/assets" }, { label: "Asset Onboarding" }]}
      />

      <StepperBar steps={steps} current={current} furthest={furthest} onSelect={goTo} />

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
