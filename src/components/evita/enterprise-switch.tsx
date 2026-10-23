import { Building2, Check, ChevronDown, MapPin } from "lucide-react"
import { cn } from "cn"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { chooseEnterprise, useScope } from "@/lib/scope"

/**
 * Which customer the engineer is working for, and the way to change it.
 *
 * An ELPREMAR carries work for more than one enterprise at a time, so the
 * tablet shows one and this says which. Picking another re-scopes everything -
 * the book of work, the register, the reports, the visits - because they are
 * different customers' sites and mixing them is how an inspection ends up
 * recorded against the wrong panel.
 *
 * A plain chip when there is only one posting: a chooser with nothing to choose
 * is a control that only ever disappoints.
 */
export function EnterpriseSwitch({ className }: { className?: string }) {
  const { postings, enterprise, plant } = useScope()

  if (postings.length < 2) {
    return (
      <span className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm ring-1", className)}>
        <MapPin className="size-4 shrink-0" />
        <span className="truncate">
          {plant}, {enterprise}
        </span>
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm ring-1 transition-colors",
          className
        )}
      >
        <MapPin className="size-4 shrink-0" />
        <span className="truncate">
          {plant}, {enterprise}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-70" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          You are assigned to {postings.length} enterprises
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {postings.map((posting) => {
          const on = posting.enterprise === enterprise
          return (
            <DropdownMenuItem
              key={posting.enterprise}
              onSelect={() => chooseEnterprise(posting.enterprise)}
              className="min-h-12 gap-2.5"
            >
              <Building2 className={cn("size-4 shrink-0", on ? "text-primary" : "text-muted-foreground")} />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm", on && "font-semibold text-primary")}>
                  {posting.enterprise}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{posting.plant}</span>
              </span>
              {on ? <Check className="size-4 shrink-0 text-primary" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
