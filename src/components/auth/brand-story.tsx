import { Leaf } from "lucide-react"

import { Rise } from "@/components/auth/auth-screen"
import { brand } from "@/config/brand"

/**
 * The panel beside the form on the photo: the EVITA wordmark, what the app is
 * for, and the four things an ELPREMAR does with it. Landscape only — in
 * portrait the auth screen hides it and centres the card.
 */
export function BrandStory() {
  return (
    <div className="max-w-xl">
      <Rise delay={60}>
        <h2 className="mt-3 text-6xl font-black tracking-tight text-white">
          EVITA
          <sup className="ml-1 align-super text-base font-semibold text-white/60">™</sup>
        </h2>
        <p className="mt-2 max-w-md text-lg text-white/85">{brand.strapline}</p>
      </Rise>

      <ul className="mt-8 space-y-4">
        {brand.features.map(({ icon: Icon, label, detail }, i) => (
          <li key={label}>
            <Rise delay={140 + i * 80}>
              <div className="flex items-start gap-3">
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/25 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ring-1 ring-white/30">
                  <Icon className="size-5" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-base font-semibold text-white">{label}</span>
                  <span className="block text-sm text-white/70">{detail}</span>
                </span>
              </div>
            </Rise>
          </li>
        ))}
      </ul>

      <Rise delay={420} className="mt-9">
        <div className="max-w-sm border-t border-white/30 pt-4">
          <p className="flex items-start gap-2.5 text-base text-white/90">
            <Leaf className="mt-0.5 size-5 shrink-0 text-healthy" />
            <span>
              People. Technology. Reliability.
              <br />A Greener Future.
            </span>
          </p>
        </div>
      </Rise>
    </div>
  )
}
