/**
 * Mapping between electrical equipment categories and their high-resolution pictorial imagery.
 * Used across the tablet home screen, asset categories, and work rows to provide an attractive,
 * app-style pictorial view.
 */
export function categoryImage(categoryOrName?: string): string | undefined {
  if (!categoryOrName) return undefined
  const c = categoryOrName.toLowerCase()

  if (c.includes("dist") && (c.includes("trans") || c.includes("dtr"))) {
    return "/brand/assets/distribution-transformer.jpg"
  }
  if (c.includes("power trans") || c.includes("ptr")) {
    return "/brand/assets/power-transformer.jpg"
  }
  if (c.includes("transf") || c.includes("trf")) {
    return "/brand/assets/power-transformer.jpg"
  }
  if (c.includes("ht panel") || c.includes("high tension") || c.includes("htp")) {
    return "/brand/assets/ht-panel.jpg"
  }
  if (c.includes("lt panel") || c.includes("low tension") || c.includes("ltp")) {
    return "/brand/assets/lt-panel.jpg"
  }
  if (c.includes("mcc") || c.includes("motor control")) {
    return "/brand/assets/mcc-panel.jpg"
  }
  if (c.includes("pcc") || c.includes("power control")) {
    return "/brand/assets/lt-panel.jpg"
  }
  if (c.includes("vcb") || c.includes("vacuum circuit")) {
    return "/brand/assets/vcb-breaker.jpg"
  }
  if (c.includes("acb") || c.includes("air circuit")) {
    return "/brand/assets/acb-breaker.jpg"
  }
  if (c.includes("vfd") || c.includes("variable frequency") || c.includes("drive")) {
    return "/brand/assets/vfd-drive.jpg"
  }
  if (c.includes("busbar") || c.includes("bus")) {
    return "/brand/assets/switchgear-busbar.jpg"
  }
  if (
    c.includes("thermal") ||
    c.includes("trench") ||
    c.includes("cable") ||
    c.includes("scan") ||
    c.includes("inspect")
  ) {
    return "/brand/assets/thermal-inspection.jpg"
  }
  if (c.includes("substation")) {
    return "/brand/assets/substation-transformer.jpg"
  }
  if (c.includes("production") || c.includes("plant")) {
    return "/brand/assets/lt-panel.jpg"
  }
  if (
    c.includes("panel") ||
    c.includes("breaker") ||
    c.includes("switchgear") ||
    c.includes("mcb") ||
    c.includes("db") ||
    c.includes("apfc")
  ) {
    return "/brand/assets/ht-panel.jpg"
  }

  return undefined
}
