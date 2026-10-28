/**
 * The organisations the EVITA backend actually holds.
 *
 * A mirror of `prisma/seeds/demo-organisations.seed.js` in evita-backend, kept
 * word for word. It is not decoration: the asset API resolves an enterprise, a
 * plant, a department and a sub-department **by name**, so a name this app
 * invents is a name the server refuses. Onboarding used to send generated ones
 * - "ABC Industries Ltd.", "Mumbai Unit 2" - and every submission came back
 * `404 Enterprise "..." not found`.
 *
 * Everything the tablet shows about where an asset sits is therefore derived
 * from this list and nothing else: the postings on the home screen, the plants
 * and department trees on step 1, and the enterprise and plant named by every
 * generated row of work.
 *
 * TODO(api): the engineer's own postings belong in `GET /me` as
 * `postings: { enterpriseId, plantId }[]`, and the tree behind them in a call
 * of its own. Until those exist this file is the contract, and it has to be
 * re-checked whenever the seed changes - the two cannot drift apart without
 * writes failing again.
 */

export type SeededSubDepartment = { code: string; name: string }

export type SeededDepartment = {
  code: string
  name: string
  subDepartments: SeededSubDepartment[]
}

export type SeededPlant = {
  code: string
  name: string
  city: string
  state: string
  departments: SeededDepartment[]
}

export type SeededEnterprise = {
  /** The enterprise id EVITA uses internally; the server matches on the name */
  id: string
  name: string
  shortName: string
  industry: string
  country: string
  city: string
  state: string
  plants: SeededPlant[]
}

/** The three enterprises the backend is seeded with, and their six plants */
export const seededEnterprises: SeededEnterprise[] = [
  {
    id: "TATA-ENT-001",
    name: "Tata Steel Limited",
    shortName: "TATA",
    industry: "Iron & Steel",
    country: "India",
    city: "Jamshedpur",
    state: "Jharkhand",
    plants: [
      {
        code: "JSR-01",
        name: "Jamshedpur Works",
        city: "Jamshedpur",
        state: "Jharkhand",
        departments: [
          {
            code: "ELEC",
            name: "Electrical",
            subDepartments: [
              { code: "ELEC-HT", name: "HT Maintenance" },
              { code: "ELEC-LT", name: "LT Maintenance" },
            ],
          },
          { code: "UTIL", name: "Utilities", subDepartments: [{ code: "UTIL-WTP", name: "Water Treatment" }] },
          { code: "INC", name: "Instrumentation & Control", subDepartments: [] },
        ],
      },
      {
        code: "KLN-01",
        name: "Kalinganagar Works",
        city: "Kalinganagar",
        state: "Odisha",
        departments: [
          {
            code: "KLN-ELEC",
            name: "Electrical",
            subDepartments: [{ code: "KLN-ELEC-SUB", name: "Substation Maintenance" }],
          },
          { code: "KLN-OPS", name: "Operations", subDepartments: [] },
        ],
      },
    ],
  },
  {
    id: "RIL-ENT-002",
    name: "Reliance Industries Limited",
    shortName: "RIL",
    industry: "Oil & Gas",
    country: "India",
    city: "Mumbai",
    state: "Maharashtra",
    plants: [
      {
        code: "JMN-01",
        name: "Jamnagar Refinery",
        city: "Jamnagar",
        state: "Gujarat",
        departments: [
          {
            code: "JMN-ELEC",
            name: "Electrical",
            subDepartments: [
              { code: "JMN-ELEC-HV", name: "HV Systems" },
              { code: "JMN-ELEC-MCC", name: "MCC & Drives" },
            ],
          },
          {
            code: "JMN-MNT",
            name: "Maintenance",
            subDepartments: [{ code: "JMN-MNT-ROT", name: "Rotating Equipment" }],
          },
          { code: "JMN-EHS", name: "EHS", subDepartments: [] },
        ],
      },
      {
        code: "HZR-01",
        name: "Hazira Complex",
        city: "Surat",
        state: "Gujarat",
        departments: [
          {
            code: "HZR-ELEC",
            name: "Electrical",
            subDepartments: [{ code: "HZR-ELEC-PWR", name: "Power Distribution" }],
          },
          { code: "HZR-SAF", name: "Safety", subDepartments: [] },
        ],
      },
    ],
  },
  {
    id: "UTCL-ENT-003",
    name: "UltraTech Cement Limited",
    shortName: "UTCL",
    industry: "Cement",
    country: "India",
    city: "Mumbai",
    state: "Maharashtra",
    plants: [
      {
        code: "AWP-01",
        name: "Awarpur Cement Works",
        city: "Chandrapur",
        state: "Maharashtra",
        departments: [
          {
            code: "AWP-ELEC",
            name: "Electrical",
            subDepartments: [
              { code: "AWP-ELEC-KLN", name: "Kiln Electricals" },
              { code: "AWP-ELEC-CRU", name: "Crusher Electricals" },
            ],
          },
          { code: "AWP-PRD", name: "Production", subDepartments: [] },
        ],
      },
      {
        code: "RDP-01",
        name: "Reddipalayam Plant",
        city: "Ariyalur",
        state: "Tamil Nadu",
        departments: [
          {
            code: "RDP-ELEC",
            name: "Electrical",
            subDepartments: [{ code: "RDP-ELEC-PKG", name: "Packing Plant Electricals" }],
          },
          { code: "RDP-UTIL", name: "Utilities", subDepartments: [] },
        ],
      },
    ],
  },
]

/** Every seeded plant, with the enterprise it belongs to */
export const seededPlants = seededEnterprises.flatMap((e) =>
  e.plants.map((plant) => ({ enterprise: e, plant })),
)

/** One seeded enterprise by name, or undefined if the server has never heard of it */
export const seededEnterpriseNamed = (name: string) => seededEnterprises.find((e) => e.name === name)
