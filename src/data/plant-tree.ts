/**
 * Where in a plant's own tree a job's asset sits.
 *
 * Both the inspection and the maintenance detail show the owning department and
 * sub-department, and both must name ones that actually exist under that plant -
 * the same rule the asset register follows. Derived from the row's id so a given
 * task always reads the same.
 */
import { enterpriseRecords, profileFor, type TaskRow } from "@/data/occ-tables"

export function placeInPlant(row: Pick<TaskRow, "id" | "enterprise" | "plant">) {
  const site = enterpriseRecords.find((e) => e.name === row.enterprise)
  const plant = site ? profileFor(site).plants.find((p) => p.name === row.plant) : undefined
  const departments = plant?.departments ?? []
  if (!departments.length) return { department: "", subDepartment: "" }

  const seed = [...row.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)
  const department = departments[seed % departments.length]
  const subs = department.subDepartments
  return {
    department: department.name,
    subDepartment: subs.length ? subs[seed % subs.length].name : "",
  }
}
