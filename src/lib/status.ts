import type { ChartConfig } from "@/components/ui/chart"

/**
 * Single source of truth for status colours. Screens should use these maps
 * instead of choosing colours themselves, so a Healthy asset looks the same
 * in a badge, a donut chart, a map marker and a KPI tile.
 * The colours themselves live as CSS variables in src/index.css.
 */

/** Asset / enterprise / plant health (URS 10.15: GREEN, ORANGE, RED) */
export type HealthStatus = "healthy" | "attention" | "critical" | "offline"

export const healthStatus: Record<
  HealthStatus,
  { label: string; color: string; badge: HealthStatus; dot: string; tile: string }
> = {
  healthy: {
    label: "Healthy",
    color: "var(--success)",
    badge: "healthy",
    dot: "bg-healthy",
    tile: "bg-healthy-soft text-healthy-soft-foreground",
  },
  attention: {
    label: "Alarming",
    color: "var(--warning)",
    badge: "attention",
    dot: "bg-attention",
    tile: "bg-attention-soft text-attention-soft-foreground",
  },
  critical: {
    label: "At Risk",
    color: "var(--destructive)",
    badge: "critical",
    dot: "bg-critical",
    tile: "bg-critical-soft text-critical-soft-foreground",
  },
  offline: {
    label: "Offline",
    color: "var(--neutral)",
    badge: "offline",
    dot: "bg-offline",
    tile: "bg-offline-soft text-offline-soft-foreground",
  },
}

/** Ready-made Recharts config for health donuts and trend lines */
export const healthChartConfig = {
  healthy: { label: "Healthy", color: "var(--success)" },
  attention: { label: "Alarming", color: "var(--warning)" },
  critical: { label: "At Risk", color: "var(--destructive)" },
  offline: { label: "Offline", color: "var(--neutral)" },
} satisfies ChartConfig

/** Alert severity (Critical Alerts table) */
export type AlertSeverity = "critical" | "warning" | "info"

export const alertSeverity: Record<AlertSeverity, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-critical text-critical-foreground" },
  warning: { label: "Warning", className: "bg-attention text-attention-foreground" },
  info: { label: "Info", className: "bg-info text-info-foreground" },
}

/** Workflow status (alerts, tickets, tasks, maintenance) */
export type WorkStatus =
  | "open"
  | "in_progress"
  | "pending"
  | "assigned"
  | "completed"
  | "closed"
  /** An approver sent the work back for correction */
  | "rejected"
  /** A closed support ticket that came back */
  | "reopened"

export const workStatus: Record<
  WorkStatus,
  { label: string; badge: "critical" | "info" | "warning" | "success" | "neutral" | "highlight" }
> = {
  open: { label: "Open", badge: "critical" },
  in_progress: { label: "In Progress", badge: "info" },
  pending: { label: "Pending", badge: "warning" },
  assigned: { label: "Assigned", badge: "info" },
  completed: { label: "Completed", badge: "success" },
  closed: { label: "Closed", badge: "neutral" },
  rejected: { label: "Rejected", badge: "critical" },
  reopened: { label: "Reopened", badge: "warning" },
}

/**
 * A maintenance activity is planned work an approver signs off, so those screens
 * word two of the shared statuses in approval terms. Everything else uses
 * `workStatus` as-is.
 */
export const maintenanceStatus: Partial<Record<WorkStatus, (typeof workStatus)[WorkStatus]>> = {
  open: { label: "Pending For Approval", badge: "warning" },
  // Purple, so signed-off work is not mistaken for finished work at a glance
  assigned: { label: "Approved", badge: "highlight" },
}

/**
 * The statuses a maintenance activity moves through, in order, and the options
 * the Status filter offers. Rejected is reachable from the approval dialog and
 * still renders on the row, but it is not offered as a filter.
 */
export const maintenanceStatuses: WorkStatus[] = ["open", "assigned", "in_progress", "completed"]

/**
 * An inspection activity is signed off before it starts, so what the shared map
 * calls Pending reads as Approved. There is no separate assigned state.
 */
export const inspectionStatus: Partial<Record<WorkStatus, (typeof workStatus)[WorkStatus]>> = {
  // Same purple as maintenance, so Approved never reads as finished work
  pending: { label: "Approved", badge: "highlight" },
}

/** The statuses an inspection activity moves through, in order */
export const inspectionStatuses: WorkStatus[] = ["pending", "in_progress", "completed"]

/**
 * A support ticket runs Open → In Progress → Closed. Reopened is carried so a
 * ticket that comes back renders correctly; nothing sets it yet.
 */
export const ticketStatuses: WorkStatus[] = ["open", "in_progress", "closed", "reopened"]

/** What the Status filter offers — the three states a ticket can be in */
export const ticketFilterStatuses: WorkStatus[] = ["open", "in_progress", "closed"]

/** Categorical series colours, in order, for charts with arbitrary groups */
export const chartSeries = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const
