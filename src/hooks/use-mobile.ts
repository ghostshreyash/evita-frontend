import * as React from "react"

/**
 * Below this width the sidebar is a drawer that opens from the menu button and
 * covers the page, instead of a column that takes width from it. 1440px keeps
 * both target tablets (ThinkTab X11 ~1333px, Galaxy Tab S9 FE ~1111px landscape,
 * both narrower in portrait) and phones on the drawer; only desktops dock it.
 */
const MOBILE_BREAKPOINT = 1440

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() => window.innerWidth < MOBILE_BREAKPOINT)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
