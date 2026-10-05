import { NavLink, useLocation } from "react-router"
import { Leaf } from "lucide-react"
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

const under = (current: string, path: string) =>
  path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`)

/** A section stays highlighted on its own screens and on the details screens it covers */
function isActivePath(current: string, item: NavItem) {
  return [item.path, ...(item.covers ?? [])].some((path) => under(current, path))
}

/** Who is signed in, as at the top of the EVITA sidebar in the mockup */
function Profile() {
  const { user } = useAuth()
  const me = useCurrentElpremar()
  const online = useOnline()

  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div className="relative shrink-0">
        <Avatar className="size-12 ring-2 ring-white/80">
          <AvatarFallback className="bg-brand-gold-soft text-base font-semibold text-brand-navy">
            {user?.initials ?? "EL"}
          </AvatarFallback>
        </Avatar>
        {/* In the icon rail the dot alone carries the connection state */}
        <span
          className={cn(
            "absolute right-0 bottom-0 size-3.5 rounded-full ring-2 ring-sidebar",
            online ? "bg-healthy" : "bg-offline"
          )}
        />
      </div>
      <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
        <div className="truncate text-base font-semibold text-white">{me.name}</div>
        <div className="text-sm">ELPREMAR</div>
        <div className="text-sm">{me.id}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-sm">
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 items-center justify-center bg-[#f7f4ee] p-1.5">
        <OlivineLogo className="h-full group-data-[collapsible=icon]:hidden" />
        <OlivineEmblem className="hidden size-11 group-data-[collapsible=icon]:block" />
      </SidebarHeader>

      <Profile />

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(pathname, item)}
                    tooltip={item.title}
                    className="text-[0.9375rem] data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground [&_svg]:size-5"
                  >
                    {/* On a phone-width sheet, choosing a section closes the sheet */}
                    <NavLink to={item.path} onClick={() => isMobile && setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge className="top-3.5 rounded-full bg-critical text-critical-foreground">
                      {item.badge}
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Mountain artwork from the mockups; dropped on short screens so the menu never scrolls */}
      <SidebarFooter className="relative overflow-hidden p-0 group-data-[collapsible=icon]:hidden [@media(max-height:720px)]:hidden">
        <img src="/brand/sidebar-mountains.jpg" alt="" className="h-36 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-transparent to-sidebar/80" />
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 text-center text-sm text-white">
          <Leaf className="size-6 fill-healthy text-healthy" />
          <span>Reliable Assets. Safer Operations.</span>
          <span>A Greener Tomorrow.</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
