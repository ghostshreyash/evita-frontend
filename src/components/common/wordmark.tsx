import { cn } from "cn"

import { brand } from "@/config/brand"

/**
 * The product wordmark: EVITA-AI, with the AI set apart.
 *
 * The client asked for the AI to read as its own thing - the suite is pitched as
 * an AI platform - so the name is drawn in two tones rather than one. The green
 * is the app's own `healthy` token rather than the olive in the sign-in gradient:
 * that olive falls just under the 3:1 contrast a large heading needs on a white
 * card, and this one holds up on the card, the photograph and the top bar alike.
 *
 * A component rather than three copies of the markup: the sign-in card, the
 * photo panel and the top bar all draw the same name at three sizes, and they
 * had already drifted apart on the trademark mark before this.
 */
export function Wordmark({
  className,
  aiClassName,
  tmClassName,
}: {
  /** The whole name; the surrounding heading usually carries the size already */
  className?: string
  /** What the AI is picked out in, where the default green does not carry */
  aiClassName?: string
  /** The trademark mark, a size and colour of its own on every surface */
  tmClassName?: string
}) {
  return (
    <span className={className}>
      {brand.wordmark.lead}
      <span className={cn("text-healthy", aiClassName)}>{brand.wordmark.ai}</span>
      <sup className={cn("align-super", tmClassName)}>™</sup>
    </span>
  )
}
