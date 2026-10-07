import { NavLink, useLocation } from "react-router"
import { cn } from "cn"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { OlivineEmblem, OlivineLogo } from "@/components/layout/olivine-logo"
import { navigation, type NavItem } from "@/config/navigation"
import { useOnline } from "@/hooks/use-media"
import { useAuth } from "@/lib/auth/context"
import { useCurrentElpremar } from "@/lib/me"
import { actionFor, useMyJobs } from "@/lib/work"

const under = (current: string, path: string) =>
  path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`)

/** A section stays highlighted on its own screens and on the details screens it covers */
function isActivePath(current: string, item: NavItem) {
  return [item.path, ...(item.covers ?? [])].some((path) => under(current, path))
}

/** Who is signed in, in a card under the logo as in the EVITA tablet design */
function Profile() {
  const { user } = useAuth()
  const me = useCurrentElpremar()
  const online = useOnline()

  return (
    <div className="mx-3 mt-3 flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:ring-0">
      <div className="relative shrink-0">
        <Avatar className="size-12">
          <AvatarFallback className="bg-primary text-base font-bold text-primary-foreground">{user?.initials ?? "EL"}</AvatarFallback>
        </Avatar>
        {/* In the icon rail the dot alone carries the connection state */}
        <span className={cn("absolute right-0 bottom-0 size-3.5 rounded-full ring-2 ring-sidebar", online ? "bg-healthy" : "bg-offline")} />
      </div>
      <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
        <div className="truncate text-base font-semibold text-white">{me.name}</div>
        <div className="mt-0.5 truncate text-sm text-sidebar-foreground">ELPREMAR · {me.id}</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
          <span className={cn("size-2 rounded-full", online ? "bg-healthy" : "bg-offline")} />
          <span className={online ? "text-healthy" : "text-sidebar-muted-foreground"}>{online ? "Online" : "Offline"}</span>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  // Work still needing the engineer's hands, shown against My Tasks
  const openWork = useMyJobs().filter((j) => actionFor(j) !== "view").length

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 items-center justify-center bg-[#f7f4ee] p-1.5">
        <OlivineLogo className="h-full group-data-[collapsible=icon]:hidden" />
        <OlivineEmblem className="hidden size-11 group-data-[collapsible=icon]:block" />
      </SidebarHeader>

      <Profile />

      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigation.map((item) => {
                const badge = item.path === "/my-tasks" ? openWork : item.badge
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActivePath(pathname, item)}
                      tooltip={item.title}
                      className="h-12 rounded-xl px-4 text-[0.9375rem] data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground data-active:shadow-lg data-active:shadow-primary/30 [&_svg]:size-5"
                    >
                      {/* On a phone-width sheet, choosing a section closes the sheet */}
                      <NavLink to={item.path} onClick={() => isMobile && setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {badge ? (
                      <SidebarMenuBadge className="top-3.5 right-3 min-w-6 rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground ring-2 ring-sidebar">
                        {badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between text-xs text-sidebar-muted-foreground">
          <span>EVITA PWA Client</span>
          <span className="tabular-nums">v1.0.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
