import { cn } from "cn"

import { brand } from "@/config/brand"

/**
 * What EVITA stands for, with the letters the name is built from marked.
 *
 * Written out flat it is a long sentence that reads as filler under a logo;
 * marking the initials makes it an expansion, and the eye takes it in as one
 * thing rather than seven words. The words are not hard-coded here - they come
 * from `brand.systemInitials`, so the copy stays in one place.
 */
export function SystemName({ className }: { className?: string }) {
  return (
    <p className={cn("leading-snug font-medium text-balance", className)}>
      {brand.system.split(" ").map((word, i) => {
        const lead = (brand.systemInitials as readonly string[]).includes(word)
        return (
          <span key={`${word}-${i}`}>
            {i ? " " : ""}
            {lead ? (
              <>
                <span className="font-extrabold">{word[0]}</span>
                <span className="opacity-80">{word.slice(1)}</span>
              </>
            ) : (
              <span className="opacity-80">{word}</span>
            )}
          </span>
        )
      })}
    </p>
  )
}
