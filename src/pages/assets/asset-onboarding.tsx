import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { StepperBar } from "@/components/common/wizard"
import { Button } from "@/components/ui/button"
import { onboardAsset, updateAsset, useAssetProfile, useAssets, valuesFrom } from "@/data/asset-store"
import type { AssetRecord } from "@/data/asset-data"
import { assetSchema, missingUploads, stepFields, type AssetFormValues } from "@/pages/assets/schemas"
import { keyForLabel, missingParameters, useCategoryParameters } from "@/lib/api/use-category-parameters"
import { useSite } from "@/lib/api/use-site"
import { ApiError } from "@/lib/api/client"
import { AssetsLoading, AssetsUnreachable } from "@/components/assets/asset-states"
import { StepDetails } from "@/pages/assets/steps/step-details"
import { StepTechnical } from "@/pages/assets/steps/step-technical"
import { StepUploads } from "@/pages/assets/steps/step-uploads"
import { StepReview } from "@/pages/assets/steps/step-review"
import { AssetIdScreen } from "@/pages/assets/asset-id"

/** The form before anything is read into it */
const blankValues = (): AssetFormValues => ({
  enterprise: "",
  plant: "",
  department: "",
  subDepartment: "",
  area: "",
  category: "",
  tag: "",
  description: "",
  /* Filled in per asset type on step 2, from the server's copy of the sheet */
  parameters: {},
  environment: "",
  latitude: "",
  longitude: "",
  images: [],
  documents: [],
})

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
  /* The engineer's own posting: the enterprise and plant are read, not chosen */
  const { site, status: siteStatus, error: siteError } = useSite()

  /* Correcting an asset rather than registering one, if the route names one */
  const { id: editing } = useParams()
  const register = useAssets()
  const asset = useMemo(
    () => (editing ? register.rows.find((a) => a.id === editing) : undefined),
    [register.rows, editing],
  )
  const { profile: heldProfile } = useAssetProfile(editing)

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
    defaultValues: blankValues(),
  })

  /*
   * What this asset type is asked for. Read from the server, which holds the
   * client's onboarding sheet and validates the answers against it - so the
   * form can never offer a parameter the submission would be refused for.
   */
  const category = form.watch("category")
  const { specs, status: specsStatus } = useCategoryParameters(category)

  /* The engineer's own posting, which is the only site EVITA registers assets at */
  useEffect(() => {
    if (!site || editing) return
    form.reset({
      ...blankValues(),
      enterprise: site.enterprise.name,
      plant: site.plant.name,
      department: site.departments[0]?.name ?? "",
      // Pre-filled from the plant's own registered location, and editable on site
      latitude: site.plant.latitude === null ? "" : String(site.plant.latitude),
      longitude: site.plant.longitude === null ? "" : String(site.plant.longitude),
    })
    // `form` is stable; resetting on its identity would wipe what was typed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, editing])

  /*
   * Reading an asset back in to correct it, in two passes: its category first,
   * so the type's parameters are fetched, then the answers once those have
   * arrived - they are stored by label and only the specification says which
   * key each one belongs to.
   */
  useEffect(() => {
    if (!heldProfile) return
    if (form.getValues("category") !== heldProfile.details.category) {
      form.setValue("category", heldProfile.details.category)
      return
    }
    if (specsStatus !== "ready") return
    form.reset(valuesFrom(heldProfile, (label) => keyForLabel(specs, label)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldProfile, specs, specsStatus])

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
      const owed = missingParameters(specs, values.parameters ?? {})
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

  const submit = form.handleSubmit(async (values) => {
    setPending(true)
    try {
      if (asset) {
        const record = await updateAsset(asset.id, values)
        toast.success(`${record.id} corrected.`)
        navigate(`/assets/${record.id}`)
        return
      }
      const record = await onboardAsset(values)
      setCreated(record)
      window.scrollTo({ top: 0, behavior: "smooth" })
      toast.success(`${record.id} registered.`)
    } catch (cause) {
      /*
       * The server validates the whole submission again - a tag already in use
       * at this plant, a rating the asset type will not accept - and says which
       * fields it refused. Nothing was saved, so the wizard stays where it is
       * with everything the engineer typed still in it.
       */
      const message = cause instanceof ApiError ? cause.readable : "Could not reach the server."
      toast.error(message)
    } finally {
      setPending(false)
    }
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

  /*
   * Nothing can be filled in until the plant is known: the enterprise and plant
   * are read onto the form, and the department list is the plant's own.
   */
  if (siteStatus !== "ready" || !site) {
    return (
      <div>
        <PageHeader
          title={asset ? `Correct ${asset.id}` : "Asset Onboarding"}
          breadcrumbs={[{ label: "Assets", to: "/assets" }, { label: "Asset Onboarding" }]}
        />
        {siteStatus === "error" ? (
          <AssetsUnreachable message={siteError} backTo="/assets" />
        ) : (
          <AssetsLoading label="Reading your plant…" />
        )}
      </div>
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
      {current === 1 ? (
        specsStatus === "ready" ? <StepTechnical form={form} specs={specs} /> : <AssetsLoading label="Reading what this asset type is asked for…" />
      ) : null}
      {current === 2 ? <StepUploads form={form} specs={specs} /> : null}
      {current === 3 ? <StepReview form={form} specs={specs} onEdit={goTo} /> : null}

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
