import { BarChart3, ClipboardCheck, Leaf, ShieldCheck, Wrench, type LucideIcon } from "lucide-react"

/**
 * Everything the EVITA sign-in screens say about the product.
 *
 * In occ-frontend this is one entry of a three-brand table (`src/config/brands.ts`)
 * picked by hostname. EVITA is its own deployment, so only its entry lives here;
 * keep the wording in step with that file when either changes.
 */
export const brand = {
  /** Wordmark expansion shown on the sign-in card and in the top bar */
  system: "Enterprise Electrical Maintenance & Reliability Management System",
  tagline: "Field Insights. Reliable Assets.",
  /** Line under the big wordmark on the photo panel */
  strapline: "Electrical Asset Management for a Safer Tomorrow",
  /** What an ELPREMAR does with EVITA, listed beside the form */
  features: [
    { icon: ClipboardCheck, label: "Inspect", detail: "Assigned activities, QR-coded assets, offline ready" },
    { icon: Wrench, label: "Maintain", detail: "Testing, measurements and findings from the floor" },
    { icon: BarChart3, label: "Ensure reliability", detail: "Every reading feeds the enterprise's health" },
    { icon: Leaf, label: "Enable a greener future", detail: "Safer work and more sustainable operations" },
  ] satisfies { icon: LucideIcon; label: string; detail: string }[],
  /** Short promises along the foot of the sign-in screen */
  promises: [
    { icon: ShieldCheck, label: "Work Safely" },
    { icon: Wrench, label: "Keep Assets Reliable" },
    { icon: Leaf, label: "Support a Greener Tomorrow" },
  ] satisfies { icon: LucideIcon; label: string }[],
  /** Bundled photograph behind the sign-in screen */
  photo: "/brand/evita-login.jpg",
  /**
   * Full-resolution copy served from a CDN, with `photo` as the fallback.
   * TODO: replace with OLIVINE's own licensed photography on its own CDN.
   */
  photoUrl: "https://images.pexels.com/photos/13820149/pexels-photo-13820149.jpeg?auto=compress&cs=tinysrgb&w=2400",
  login: {
    heading: "Welcome Back",
    description: "Login to access your assigned activities",
    identifierLabel: "Username",
    identifierPlaceholder: "firstname.lastname",
    submitLabel: "Login",
    notice: {
      title: "This device is for authorized ELPREMAR personnel only.",
      body: "Unauthorised access is prohibited.",
    },
  },
} as const
