import { toast } from "sonner"

import { startInspection } from "@/data/inspection-store"
import { startMaintenance } from "@/data/maintenance-store"
import type { Job } from "@/lib/work"

/** Start the job in its book: the clock starts and the record opens for this engineer */
export function startJob(job: Job, by: string) {
  if (job.kind === "inspection") startInspection(job.id, by)
  else startMaintenance(job.id, by)
  toast.success(`${job.id} started`, { description: `${job.activity} · ${job.asset}` })
}
