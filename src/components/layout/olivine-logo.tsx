import { cn } from "cn"

/*
 * Brand images were extracted from the approved mockups (EVITA_WORKFLOW.pdf).
 * Replace the files in public/brand/ with the original high-resolution artwork when available.
 */

/** Round OLIVINE GLOBAL · EST. 2024 emblem */
export function OlivineEmblem({ className }: { className?: string }) {
  return <img src="/brand/olivine-emblem.png" alt="Olivine Global" className={cn("aspect-square shrink-0", className)} />
}

/** Emblem + "OLIVINE GLOBAL SYSTEMS" wordmark used in the sidebar header */
export function OlivineLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/olivine-logo.png"
      alt="Olivine Global Systems – Reliable Today. Sustainable Tomorrow."
      className={cn("h-12 w-auto object-contain", className)}
    />
  )
}
