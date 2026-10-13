/**
 * The help the ELPREMAR can read on the tablet, transcribed from the client's
 * `Olivine_APP_AI_Chatbot_FAQ_` sheet.
 *
 * The sheet answers for all three products. Only the rows it marks for EVITA
 * are here - 254 of 321: EVITA on its own, or EVITA shared with
 * another app. Rows marked "All apps" are not EVITA rows and are left out, which
 * is why there is no Login or Troubleshooting topic.
 *
 * The wording is the client's, unedited: these are the answers OLIVINE approved,
 * and the same rows will feed the Phase-2 chatbot, so the two must not drift.
 *
 * Generated from the sheet rather than typed. Re-run the export and regenerate
 * when the sheet changes; do not edit the entries by hand.
 */

export type FaqEntry = {
  /** The sheet's own FAQ ID, kept so an answer can be traced back to its row */
  id: string
  category: string
  question: string
  answer: string
  /** Other ways the question gets asked; searched alongside the question */
  keywords: string[]
}

/** Categories in the order the sheet lists them, so related questions stay together */
export const faqCategories = [
  "Asset Onboarding",
  "Inspection Workflow",
  "Offline & Sync",
  "Support & Helpdesk",
  "Device & App",
  "Technical Basics",
  "Asset Technical Parameters – ACB (Air Circuit Breaker)",
  "Asset Technical Parameters – AMF Panel",
  "Asset Technical Parameters – APFC Panel",
  "Asset Technical Parameters – Battery Bank",
  "Asset Technical Parameters – Battery Charger",
  "Asset Technical Parameters – Busbar",
  "Asset Technical Parameters – Control Panel",
  "Asset Technical Parameters – Distribution Board (DB)",
  "Asset Technical Parameters – Distribution Transformer",
  "Asset Technical Parameters – Fire Alarm Panel",
  "Asset Technical Parameters – HT Panel",
  "Asset Technical Parameters – Industrial Network Equipment",
  "Asset Technical Parameters – Instrument Transformer (CT/PT)",
  "Asset Technical Parameters – Inverter",
  "Asset Technical Parameters – Lighting Distribution Board (LDB)",
  "Asset Technical Parameters – LT Panel",
  "Asset Technical Parameters – MCC (Motor Control Center)",
  "Asset Technical Parameters – MCCB",
  "Asset Technical Parameters – Network Switch",
  "Asset Technical Parameters – Other",
  "Asset Technical Parameters – PCC (Power Control Center)",
  "Asset Technical Parameters – PLC Panel",
  "Asset Technical Parameters – Power Transformer",
  "Asset Technical Parameters – Relay Panel",
  "Asset Technical Parameters – RTU (Remote Terminal Unit)",
  "Asset Technical Parameters – SF6 Circuit Breaker",
  "Asset Technical Parameters – Soft Starter Panel",
  "Asset Technical Parameters – Solar Combiner Box",
  "Asset Technical Parameters – Solar Inverter",
  "Asset Technical Parameters – Sub Distribution Board (SDB)",
  "Asset Technical Parameters – Transformer",
  "Asset Technical Parameters – UPS",
  "Asset Technical Parameters – VCB (Vacuum Circuit Breaker)",
  "Asset Technical Parameters – VFD (Variable Frequency Drive)",
  "Asset Type Basics",
  "Inspection Measurement Fields",
  "Asset-Family Inspection Guidance"
] as const

/**
 * What a question is matched on: its own words, the answer, and the alternate
 * phrasings the sheet gives - an engineer searching "no signal" should reach
 * the offline questions without having to use the word "sync".
 */
export function searchFaq(entries: readonly FaqEntry[], query: string): FaqEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return [...entries]
  return entries.filter((entry) => {
    const haystack = [entry.question, entry.answer, entry.category, ...entry.keywords].join(" ").toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

export const faqEntries: FaqEntry[] = [
  {
    id: "FAQ-017",
    category: "Asset Onboarding",
    question: "How do I onboard an electrical asset?",
    answer: "Open Asset Onboarding in the authorized application, select the correct enterprise, plant, location/area, and asset category, then enter the required asset identification and technical details. Complete mandatory fields, add optional information where available, validate the record, and submit it. Generate or confirm the permanent Asset ID and QR code when the workflow requires it.",
    keywords: [
      "asset onboarding",
      "add asset",
      "register electrical asset"
    ]
  },
  {
    id: "FAQ-018",
    category: "Asset Onboarding",
    question: "What does Location / Area mean during asset onboarding?",
    answer: "Location / Area identifies the broader site area where the asset is installed, such as a building, floor, production area, utility block, or retail zone. Use a consistent naming convention so users can find the asset later. The exact field definition should match the approved onboarding data dictionary.",
    keywords: [
      "location area",
      "asset location",
      "area field"
    ]
  },
  {
    id: "FAQ-019",
    category: "Asset Onboarding",
    question: "What is Location in Plant, and how is it different from Location / Area?",
    answer: "Location / Area is the broader site or zone. Location in Plant is the more precise installation position within that site, such as a room, electrical panel room, line, bay, or equipment position. Avoid duplicating the same value in both fields unless the approved data model explicitly allows it.",
    keywords: [
      "location in plant",
      "plant location",
      "asset position"
    ]
  },
  {
    id: "FAQ-020",
    category: "Asset Onboarding",
    question: "Do I need to enter latitude and longitude for every asset?",
    answer: "If the application pre-fills coordinates from the plant, verify whether asset-level coordinates are required for the use case. Plant coordinates may be sufficient for indoor assets where precise GPS positioning is unreliable. Capture separate asset coordinates only when required by the approved data model or location-tracking workflow; do not invent coordinates.",
    keywords: [
      "latitude",
      "longitude",
      "GPS",
      "coordinates"
    ]
  },
  {
    id: "FAQ-021",
    category: "Asset Onboarding",
    question: "Which asset onboarding fields are mandatory and which are optional?",
    answer: "Mandatory fields are the minimum information needed to identify, locate, classify, and manage the asset safely and consistently. Optional fields provide additional technical or operational detail when available. Follow the approved asset-category parameter matrix and the form's validation rules. If a field's status is unclear, do not guess—confirm with the application owner.",
    keywords: [
      "mandatory fields",
      "optional fields",
      "asset parameters"
    ]
  },
  {
    id: "FAQ-022",
    category: "Asset Onboarding",
    question: "Which electrical asset categories can be onboarded?",
    answer: "The defined category set includes transformers (power, distribution and instrument CT/PT), HT and LT panels, MCC, PCC, APFC and AMF panels, DB/SDB/LDB, busbars, VCB, ACB, SF6 circuit breakers, MCCB, VFD, soft starters, UPS, battery banks and chargers, inverters, relay/control/PLC panels, SCADA, RTU, fire alarm panels, solar inverters and combiner boxes, solar transformers, network switches, industrial network equipment, and Other. Use the closest approved category and avoid creating duplicate category names.",
    keywords: [
      "asset category list",
      "electrical equipment",
      "equipment type"
    ]
  },
  {
    id: "FAQ-023",
    category: "Asset Onboarding",
    question: "What is the Asset ID?",
    answer: "The Asset ID is the unique identifier used to distinguish an onboarded asset across inspections, maintenance records, reports, and support activities. Use the system-generated ID where available; do not manually reuse an ID or create duplicates. Refer to the Asset ID when raising an issue about a specific asset.",
    keywords: [
      "Asset ID",
      "asset number",
      "unique ID"
    ]
  },
  {
    id: "FAQ-024",
    category: "Asset Onboarding",
    question: "What is the purpose of the asset QR code?",
    answer: "The QR code provides a quick way to retrieve the linked asset record. When scanned in the supported workflow, it should identify the asset and show the information the user's role is authorized to view, such as enterprise, location, asset category, health history, inspection/maintenance dates, and due date where those fields are available.",
    keywords: [
      "QR code",
      "scan asset",
      "QR label"
    ]
  },
  {
    id: "FAQ-025",
    category: "Asset Onboarding",
    question: "What should I do if an asset QR code does not scan?",
    answer: "Clean the label, ensure adequate lighting, hold the tablet steady, and check that the camera permission is enabled. If scanning still fails, search for the asset using its Asset ID or the available enterprise, location, category, or other filters. If the QR code is damaged or linked to the wrong record, raise a ticket with the Asset ID and a photograph of the label.",
    keywords: [
      "QR not scanning",
      "damaged QR",
      "camera issue"
    ]
  },
  {
    id: "FAQ-026",
    category: "Asset Onboarding",
    question: "What if the asset already exists in the system?",
    answer: "Search by Asset ID, QR code, equipment serial number, and location before creating a new record. If an existing record is found, use it for inspection or request an authorized correction. Do not create a duplicate to work around missing permissions or incorrect data.",
    keywords: [
      "duplicate asset",
      "asset already exists",
      "duplicate registration"
    ]
  },
  {
    id: "FAQ-027",
    category: "Asset Onboarding",
    question: "Can I edit asset details after onboarding?",
    answer: "Changes should be made only by users with the appropriate permissions. Verify the asset identity before editing, update only the fields that are incorrect, and save the change through the approved workflow. If the Asset ID, QR association, or asset ownership/location is wrong and cannot be edited, contact support rather than creating a replacement record.",
    keywords: [
      "edit asset",
      "update asset details",
      "incorrect asset information"
    ]
  },
  {
    id: "FAQ-028",
    category: "Inspection Workflow",
    question: "How do I start an asset inspection?",
    answer: "Log in to EVITA, open Testing & Measurement, and select the onboarded asset using search/filters or QR scanning. Confirm that the selected Asset ID and location are correct, then start the inspection and complete the applicable inspection parameters. Capture required images, thermal images, measurements, observations, and findings before submitting or saving the inspection.",
    keywords: [
      "start inspection",
      "Testing & Measurement",
      "inspect asset"
    ]
  },
  {
    id: "FAQ-029",
    category: "Inspection Workflow",
    question: "How can I find an asset for inspection?",
    answer: "Use the available filters and search fields, which may include enterprise, location, subdivision, asset category, Asset ID, onboarding date, inspection date, and due date. You can also scan the asset QR code where supported. Verify the selected asset before recording any inspection data.",
    keywords: [
      "search asset",
      "filter asset",
      "select asset"
    ]
  },
  {
    id: "FAQ-030",
    category: "Inspection Workflow",
    question: "I selected the wrong asset. What should I do?",
    answer: "If inspection has not started, return to asset selection and choose the correct record. If data has already been entered, do not submit it against the wrong asset. Follow the available cancel/edit workflow or contact support to correct the association while preserving the audit trail.",
    keywords: [
      "wrong asset selected",
      "incorrect inspection asset"
    ]
  },
  {
    id: "FAQ-031",
    category: "Inspection Workflow",
    question: "Which parameters should I record during inspection?",
    answer: "Record the mandatory inspection parameters for the selected asset category and complete optional parameters where they can be measured reliably. Depending on the asset, this may include visual condition, contamination, moisture or rust indicators, enclosure/door condition, measured electrical values, temperature/thermal observations, abnormal noise or smell, and other approved checks. Follow the asset-specific checklist and site safety procedures.",
    keywords: [
      "inspection parameters",
      "measurements",
      "checklist"
    ]
  },
  {
    id: "FAQ-032",
    category: "Inspection Workflow",
    question: "When should I capture asset photographs?",
    answer: "Capture clear photographs at the points required by the inspection workflow. Ensure the correct asset is identifiable and the relevant condition is visible. Follow site rules and avoid photographing people, confidential information, or unrelated equipment unnecessarily. If a required image cannot be captured, record the reason where the app supports it.",
    keywords: [
      "asset photos",
      "upload image",
      "inspection photographs"
    ]
  },
  {
    id: "FAQ-033",
    category: "Inspection Workflow",
    question: "Why are thermal images required?",
    answer: "Thermal images can help document abnormal heat patterns and support condition assessment when thermal inspection is part of the approved checklist. Capture images using the approved device and procedure, associate them with the correct asset, and record relevant observations. Do not treat an image alone as a definitive diagnosis; follow approved engineering review and safety procedures.",
    keywords: [
      "thermal image",
      "thermography",
      "hot spot"
    ]
  },
  {
    id: "FAQ-034",
    category: "Inspection Workflow",
    question: "How should partial discharge (PD) observations be recorded?",
    answer: "Record PD measurements or observations only when the applicable test method, instrument, and checklist are available and the person is authorized to perform the test. Associate readings and evidence with the correct asset and inspection. Any limits or pass/fail criteria must come from approved engineering standards or asset-specific procedures, not from chatbot assumptions.",
    keywords: [
      "partial discharge",
      "PD",
      "discharge observation"
    ]
  },
  {
    id: "FAQ-035",
    category: "Inspection Workflow",
    question: "What should I do if I cannot submit an inspection?",
    answer: "Check that the correct asset is selected and all mandatory fields, required images, and required measurements are complete. Confirm whether the tablet is online or operating offline. Save a draft if the app supports it, note the error message, and avoid repeatedly submitting the same inspection. Contact support if the issue persists.",
    keywords: [
      "submit inspection failed",
      "inspection not saving",
      "validation error"
    ]
  },
  {
    id: "FAQ-036",
    category: "Offline & Sync",
    question: "Can I use EVITA without an internet connection?",
    answer: "EVITA is intended to support offline field work for supported workflows. When connectivity is unavailable, eligible inspection data and images may be stored locally and synchronized when connectivity returns. Before leaving the site, verify the app's saved/pending-sync status. Offline availability depends on the deployed version and which data was previously downloaded.",
    keywords: [
      "offline mode",
      "no internet",
      "no network",
      "work offline"
    ]
  },
  {
    id: "FAQ-037",
    category: "Offline & Sync",
    question: "How do I synchronize offline inspection data?",
    answer: "Reconnect to an approved network, open the app, and use the supported sync workflow if it does not start automatically. Keep the app open as needed and check that pending records and images show a successful sync status. Do not clear app data, uninstall the app, or reset the tablet while unsynchronized records may remain locally stored.",
    keywords: [
      "sync",
      "synchronize",
      "pending upload",
      "upload data"
    ]
  },
  {
    id: "FAQ-038",
    category: "Offline & Sync",
    question: "What should I do if inspection data or images are not syncing?",
    answer: "Check network connectivity, available device storage, login status, and the app's pending-sync/error indicator. Retry using the supported sync function. Keep the local data intact until synchronization is confirmed. If the issue persists, raise a ticket with the device model, app version if available, Asset ID/inspection reference, approximate time, and error message.",
    keywords: [
      "sync failed",
      "images not uploaded",
      "pending sync"
    ]
  },
  {
    id: "FAQ-039",
    category: "Offline & Sync",
    question: "What if an inspection appears twice after synchronization?",
    answer: "Do not delete records unless you are authorized and the duplicate is confirmed. Record both inspection references, the Asset ID, and the approximate sync time, then contact support for reconciliation. The system owner should verify duplicate prevention and audit history.",
    keywords: [
      "duplicate inspection",
      "duplicate upload",
      "sync duplicate"
    ]
  },
  {
    id: "FAQ-064",
    category: "Support & Helpdesk",
    question: "How do I raise a support ticket?",
    answer: "Open the Support Tickets or Helpdesk area available in your application and create a ticket with a clear summary, affected app/module, description, steps to reproduce, approximate time, and relevant reference such as Asset ID or inspection ID. Attach a screenshot or evidence if permitted and ensure it contains no passwords or unnecessary confidential information. Save the ticket ID for follow-up.",
    keywords: [
      "raise ticket",
      "create support ticket",
      "helpdesk"
    ]
  },
  {
    id: "FAQ-067",
    category: "Support & Helpdesk",
    question: "How do I check the status of my support ticket?",
    answer: "Open the support ticket list or search using the ticket ID. Review its current status, priority, assigned owner, latest update, and any request for additional information. If the ticket is overdue under the approved support policy, follow the documented escalation path and quote the existing ticket ID rather than opening duplicates.",
    keywords: [
      "ticket status",
      "ticket update",
      "ticket ID"
    ]
  },
  {
    id: "FAQ-068",
    category: "Support & Helpdesk",
    question: "What details should I include when reporting a technical issue?",
    answer: "Include the application (OCC, EMMSE-E/EMMSE 0, or EVITA), user role, affected screen, exact error message, steps taken, approximate time, device/browser details where relevant, and asset/inspection/ticket reference. Include a screenshot only when allowed. Do not include passwords, one-time codes, or unrelated personal data.",
    keywords: [
      "technical issue",
      "error message",
      "bug report",
      "screenshot"
    ]
  },
  {
    id: "FAQ-069",
    category: "Support & Helpdesk",
    question: "What if the chatbot cannot solve my problem?",
    answer: "Ask the chatbot to help you prepare a support ticket. Include the app/module, issue summary, steps already tried, error message, and relevant reference IDs. If a ticket already exists, provide its ID. The chatbot should not claim that a ticket has been created unless the application confirms successful creation.",
    keywords: [
      "chatbot cannot help",
      "speak to support",
      "human agent"
    ]
  },
  {
    id: "FAQ-070",
    category: "Support & Helpdesk",
    question: "The application is slow or not responding. What should I do?",
    answer: "Check network connectivity and whether other approved services are working. If safe, wait briefly and retry once; avoid repeated submissions that could create duplicate records. Record the screen, time, device/browser, and any error. For EVITA offline work, preserve unsynchronized local data and do not uninstall or clear app storage. Raise a ticket if the problem continues.",
    keywords: [
      "app slow",
      "app frozen",
      "not responding",
      "loading"
    ]
  },
  {
    id: "FAQ-078",
    category: "Device & App",
    question: "EVITA cannot open the camera. What should I check?",
    answer: "Check that camera permission is enabled for EVITA in the tablet settings, close other apps that may be using the camera, and reopen EVITA. If the issue continues, note the tablet model, app version, and error message and raise a support ticket. Do not reset the tablet if unsynchronized inspection data may be stored locally.",
    keywords: [
      "camera permission",
      "camera not opening",
      "QR camera"
    ]
  },
  {
    id: "FAQ-079",
    category: "Device & App",
    question: "What if the tablet storage is full?",
    answer: "Do not delete EVITA data or inspection images until you confirm that all required records have synchronized successfully and are retained on the server. Follow the organization's device-storage procedure, remove only approved nonessential files, and contact support if storage remains full or sync is blocked.",
    keywords: [
      "storage full",
      "tablet memory",
      "local images"
    ]
  },
  {
    id: "FAQ-091",
    category: "Inspection Workflow",
    question: "Can I save an inspection and complete it later?",
    answer: "If the deployed EVITA version supports draft or incomplete inspections, save the record using the provided control and verify its saved status before leaving the screen. If offline, confirm the record is stored locally. Do not assume a record is saved unless the application shows confirmation or a draft/pending status.",
    keywords: [
      "save draft",
      "incomplete inspection",
      "continue later"
    ]
  },
  {
    id: "FAQ-092",
    category: "Inspection Workflow",
    question: "Which units should I use when entering measurements?",
    answer: "Use the units displayed by the asset-specific inspection form or specified in the approved procedure. Do not convert or substitute units without verifying the target field. If the required unit is missing or ambiguous, stop and ask the application owner or responsible technical reviewer before submitting the measurement.",
    keywords: [
      "measurement units",
      "units",
      "wrong units"
    ]
  },
  {
    id: "FAQ-100",
    category: "Technical Basics",
    question: "Where should I get an asset's technical ratings?",
    answer: "Use the equipment nameplate/rating plate or verified manufacturer documentation. Enter the value and unit exactly as stated, and take a readable nameplate photograph when available. Do not estimate a rating from appearance or copy values from a similar asset.",
    keywords: [
      "nameplate",
      "rating plate",
      "technical ratings"
    ]
  },
  {
    id: "FAQ-101",
    category: "Technical Basics",
    question: "What is the difference between a mandatory and optional parameter?",
    answer: "A mandatory parameter must be completed to satisfy the current form's validation and minimum asset/inspection record. An optional parameter should be captured when the information is available and can be verified. The requirement shown in the approved asset parameter matrix takes precedence; do not invent a value to bypass a mandatory field.",
    keywords: [
      "mandatory",
      "optional",
      "required field"
    ]
  },
  {
    id: "FAQ-102",
    category: "Technical Basics",
    question: "How should I enter a numeric technical parameter?",
    answer: "Enter the measured or nameplate value in the unit shown beside the field. Check decimal placement and confirm that the instrument display and app field use compatible units. Do not add units into a numeric-only field unless the form specifically asks for them.",
    keywords: [
      "numeric field",
      "measurement value",
      "decimal",
      "unit"
    ]
  },
  {
    id: "FAQ-103",
    category: "Technical Basics",
    question: "What should I do if a technical parameter is not available on the nameplate?",
    answer: "Do not guess or copy a value from another asset. If the field is optional, leave it blank when permitted. If it is mandatory, check approved manufacturer documentation or ask the responsible technical person. If the form does not allow a valid unknown/not-applicable response, raise a ticket for clarification.",
    keywords: [
      "unknown parameter",
      "nameplate missing",
      "value unavailable"
    ]
  },
  {
    id: "FAQ-104",
    category: "Technical Basics",
    question: "Can I enter zero when a parameter is not applicable?",
    answer: "No. Zero is a real numeric value and should not be used as a substitute for unknown or not applicable. Use an approved 'Not Applicable' or 'Unknown' option if the form provides one; otherwise follow the data-entry policy or request clarification.",
    keywords: [
      "N/A",
      "not applicable",
      "zero value"
    ]
  },
  {
    id: "FAQ-105",
    category: "Technical Basics",
    question: "What is the difference between Manufacturer and Model / Type?",
    answer: "Manufacturer identifies the company that made the equipment. Model / Type identifies the manufacturer's specific product series, model, or equipment type. Copy both from the nameplate or verified documentation where available.",
    keywords: [
      "manufacturer",
      "model",
      "type"
    ]
  },
  {
    id: "FAQ-106",
    category: "Technical Basics",
    question: "What does asset Criticality mean?",
    answer: "Criticality represents the asset's relative business and safety impact if it fails. The parameter sheet uses High, Medium, and Low. Select the level according to the organization's approved criticality criteria and authorized assessment—not personal guesswork.",
    keywords: [
      "criticality",
      "high medium low"
    ]
  },
  {
    id: "FAQ-107",
    category: "Technical Basics",
    question: "What should the mandatory asset photograph show?",
    answer: "Capture a clear overall photograph that helps identify the asset and its installation/location. Keep the equipment label or Asset ID visible where practicable, and ensure the photograph is linked to the correct asset. Follow site photography and confidentiality rules.",
    keywords: [
      "asset photograph",
      "overall photo",
      "photo evidence"
    ]
  },
  {
    id: "FAQ-108",
    category: "Technical Basics",
    question: "What makes a good nameplate photograph?",
    answer: "Make the rating plate readable, in focus, adequately lit, and framed so the ratings and manufacturer details can be read. Avoid glare and do not crop out relevant ratings. If the plate is damaged or unreadable, record that fact and seek verified documentation.",
    keywords: [
      "nameplate photo",
      "rating plate photo",
      "unreadable nameplate"
    ]
  },
  {
    id: "FAQ-109",
    category: "Technical Basics",
    question: "What is voltage, and what unit should I use?",
    answer: "Voltage is the electrical potential difference between two points. The parameter workbook records voltage in volts (V) for applicable fields. Follow the field label and approved measurement procedure, and never measure voltage unless authorized and equipped to do so safely.",
    keywords: [
      "voltage",
      "V",
      "volts"
    ]
  },
  {
    id: "FAQ-110",
    category: "Technical Basics",
    question: "What is current, and what unit should I use?",
    answer: "Current is the rate of electric charge flow and is recorded in amperes (A) in the parameter workbook. Enter the value for the phase or circuit specified by the field. Measurements on electrical equipment must be performed only by authorized personnel using the approved method and instrument.",
    keywords: [
      "current",
      "ampere",
      "amps",
      "A"
    ]
  },
  {
    id: "FAQ-111",
    category: "Technical Basics",
    question: "What is electrical frequency?",
    answer: "Frequency is the number of AC cycles per second and is measured in hertz (Hz). Record the displayed/measured value in the Frequency field when the asset checklist requires it. Do not assume a nominal frequency is the actual measured value.",
    keywords: [
      "frequency",
      "Hz",
      "hertz"
    ]
  },
  {
    id: "FAQ-112",
    category: "Technical Basics",
    question: "What does Load Current per phase (R, Y, B) mean?",
    answer: "It means the measured load current for each of the three phases—R, Y, and B—entered separately in amperes (A). Do not enter one combined value into all three fields. If a phase is absent or cannot be measured, follow the approved form procedure and record the reason rather than guessing.",
    keywords: [
      "R Y B",
      "phase current",
      "three phase current"
    ]
  },
  {
    id: "FAQ-113",
    category: "Technical Basics",
    question: "What is Neutral Current?",
    answer: "Neutral current is the current flowing through the neutral conductor under the operating conditions at the time of measurement. Record it in amperes (A) where the asset-specific inspection form includes the field. Any abnormal reading must be assessed against the approved site/design criteria by a competent person.",
    keywords: [
      "neutral current",
      "neutral conductor"
    ]
  },
  {
    id: "FAQ-114",
    category: "Technical Basics",
    question: "What does Neutral-Earth Voltage mean?",
    answer: "It is the measured voltage between the neutral conductor and the protective earth reference at the measurement point. The workbook lists it as an optional inspection parameter for selected assets. Record the measured value and unit, and refer abnormal results to an authorized electrical professional; do not infer safety from the value alone.",
    keywords: [
      "neutral earth voltage",
      "N-E voltage"
    ]
  },
  {
    id: "FAQ-115",
    category: "Technical Basics",
    question: "What does Body-Earth Voltage mean?",
    answer: "It is the measured voltage between the accessible conductive body/enclosure of equipment and the designated earth reference, using the approved test method. The workbook labels this field as 'Body Earth Voltage' (one source column contains a spelling error). Any unexpected reading must be escalated for competent assessment; do not touch the equipment to test it.",
    keywords: [
      "body earth voltage",
      "enclosure earth voltage"
    ]
  },
  {
    id: "FAQ-116",
    category: "Technical Basics",
    question: "What is the difference between a rated value and an inspection measurement?",
    answer: "A rated value is the manufacturer's specified design/rating value, usually taken from the nameplate or approved documentation. An inspection measurement is the value observed in actual operating conditions at the time of inspection. Do not replace a nameplate rating with a live measurement or compare values without considering the correct units and operating conditions.",
    keywords: [
      "rated value",
      "measured value",
      "nameplate vs reading"
    ]
  },
  {
    id: "FAQ-117",
    category: "Technical Basics",
    question: "What does circuit-breaker Breaking Capacity mean?",
    answer: "Breaking capacity is the maximum fault current a breaker is designed and rated to interrupt under specified conditions, commonly shown in kiloamperes (kA). Capture it from the nameplate or verified manufacturer data. Do not infer suitability for a site fault level from this field alone; engineering verification is required.",
    keywords: [
      "breaking capacity",
      "kA",
      "fault current"
    ]
  },
  {
    id: "FAQ-118",
    category: "Technical Basics",
    question: "What does Pole Configuration (2P, 3P, 4P) mean?",
    answer: "Pole configuration indicates how many poles the device switches: 2P generally means two poles, 3P three poles, and 4P four poles. Select the configuration shown on the device/nameplate or approved documentation; do not infer it only from the number of visible handles.",
    keywords: [
      "2P",
      "3P",
      "4P",
      "poles"
    ]
  },
  {
    id: "FAQ-119",
    category: "Technical Basics",
    question: "What is the difference between kW, kVA, and kVAr?",
    answer: "kW measures real power, kVA measures apparent power, and kVAr measures reactive power. Use the unit required by the specific parameter: for example, generator rating may be expressed in kVA, rated power may be in kW or another nameplate unit, and APFC capacity is listed in kVAr. Do not convert or substitute units without confirming the field definition.",
    keywords: [
      "kW",
      "kVA",
      "kVAr",
      "power units"
    ]
  },
  {
    id: "FAQ-120",
    category: "Technical Basics",
    question: "What does battery capacity in Ah mean?",
    answer: "Ah (ampere-hour) is a battery capacity rating indicating current over time under specified test conditions. Record the unit Ah capacity from the battery label or manufacturer documentation. Actual usable capacity depends on battery type, discharge rate, temperature, age, and other conditions.",
    keywords: [
      "Ah",
      "ampere hour",
      "battery capacity"
    ]
  },
  {
    id: "FAQ-121",
    category: "Technical Basics",
    question: "What is an enclosure IP Rating?",
    answer: "An IP (Ingress Protection) rating classifies protection against access to hazardous parts and ingress of solids and water under defined test conditions. Record the rating shown on the enclosure/nameplate or verified documentation. Do not assign an IP rating by visual inspection alone.",
    keywords: [
      "IP rating",
      "ingress protection",
      "enclosure"
    ]
  },
  {
    id: "FAQ-122",
    category: "Technical Basics",
    question: "What does transformer impedance mean?",
    answer: "Transformer impedance is an electrical characteristic, commonly expressed as a percentage on the nameplate, used in system and fault-current calculations. Record the specified value and format exactly from the nameplate or verified documentation. Do not estimate it from load readings.",
    keywords: [
      "transformer impedance",
      "percentage impedance"
    ]
  },
  {
    id: "FAQ-123",
    category: "Technical Basics",
    question: "What is a transformer Vector Group?",
    answer: "The vector group describes the winding connection and phase displacement between transformer windings, using a standardized designation such as a letter/clock notation. Capture the exact designation from the transformer nameplate or approved documentation. Do not infer the vector group from the physical appearance of the transformer.",
    keywords: [
      "vector group",
      "transformer connection"
    ]
  },
  {
    id: "FAQ-124",
    category: "Technical Basics",
    question: "What does transformer Cooling Type mean?",
    answer: "Cooling type identifies the cooling method specified for the transformer. The dropdown list includes designations such as ONAN, ONAF, OFAF, OFWF, Dry type, and Other. Select the value that matches the nameplate or manufacturer documentation; do not choose a type based only on appearance.",
    keywords: [
      "ONAN",
      "ONAF",
      "OFAF",
      "OFWF",
      "dry type"
    ]
  },
  {
    id: "FAQ-125",
    category: "Technical Basics",
    question: "What is a transformer Tap Changer Type?",
    answer: "A tap changer changes the transformer's turns ratio to adjust voltage within its designed range. The workbook's dropdown includes OLTC and Off-circuit. Select the type documented for the asset. Operating or adjusting a tap changer is not an inspection data-entry task and must follow the manufacturer's procedure and authorization.",
    keywords: [
      "tap changer",
      "OLTC",
      "off-circuit"
    ]
  },
  {
    id: "FAQ-126",
    category: "Technical Basics",
    question: "What do CT/PT primary and secondary ratings mean?",
    answer: "A current transformer (CT) scales current for measurement/protection, while a voltage transformer (PT/VT) scales voltage. Primary and secondary ratings describe the rated input and output quantities/ratio. Record the values and ratio exactly from the nameplate. CT secondary circuits and instrument transformers require specialist safety precautions; do not disconnect or manipulate them as part of routine data capture.",
    keywords: [
      "CT",
      "PT",
      "primary rating",
      "secondary rating",
      "ratio"
    ]
  },
  {
    id: "FAQ-127",
    category: "Technical Basics",
    question: "What is an instrument transformer Accuracy Class?",
    answer: "Accuracy class indicates the specified measurement or protection accuracy under defined conditions. Capture the exact class marked on the CT/PT nameplate or verified documentation. Do not assign an accuracy class based on the instrument's appearance or intended use alone.",
    keywords: [
      "accuracy class",
      "CT class",
      "PT class"
    ]
  },
  {
    id: "FAQ-128",
    category: "Technical Basics",
    question: "What does the Phase field mean for a transformer?",
    answer: "The Phase field records whether the transformer is single-phase or three-phase, according to the nameplate/design documentation. Select the appropriate dropdown value and do not infer it solely from the number of external cables.",
    keywords: [
      "single phase",
      "three phase",
      "transformer phase"
    ]
  },
  {
    id: "FAQ-129",
    category: "Technical Basics",
    question: "What does Rated Power mean for an electrical asset?",
    answer: "Rated Power is the manufacturer's stated power capacity under specified conditions. The unit depends on the equipment and field—for example, kW or kVA may be used. Copy the value and unit from the nameplate and ensure they match the field label.",
    keywords: [
      "rated power",
      "power rating"
    ]
  },
  {
    id: "FAQ-130",
    category: "Technical Basics",
    question: "What does Rated Current mean?",
    answer: "Rated Current is the current rating specified for the equipment or component under stated conditions. It is not necessarily the current being drawn during inspection. Record the nameplate value in amperes (A) and keep it distinct from measured load current.",
    keywords: [
      "rated current",
      "current rating"
    ]
  },
  {
    id: "FAQ-131",
    category: "Technical Basics",
    question: "What is a panel Short Circuit Rating?",
    answer: "A short-circuit rating indicates the fault-current withstand or interrupting capability defined for the panel or equipment under specified conditions. Record the exact rating and unit from approved documentation. Suitability for an installation requires engineering verification against the system fault level and coordination requirements.",
    keywords: [
      "short circuit rating",
      "fault withstand"
    ]
  },
  {
    id: "FAQ-132",
    category: "Technical Basics",
    question: "What are Incomer and Outgoing ways in a panel?",
    answer: "The incomer is the incoming supply device/circuit feeding the panel. Outgoing ways are the outgoing circuits supplied from the panel. Record the incomer type/rating and outgoing-way count from the approved panel details or verified inspection, as required by the form.",
    keywords: [
      "incomer",
      "outgoing way",
      "feeder"
    ]
  },
  {
    id: "FAQ-133",
    category: "Technical Basics",
    question: "What is Motor Starter Technology in an MCC?",
    answer: "Motor starter technology describes how a motor feeder starts or controls a motor, such as direct-on-line, star-delta, soft starter, or variable-frequency drive, where those options are supported by the approved data model. Select the actual installed arrangement based on panel labels or verified documentation.",
    keywords: [
      "motor starter",
      "MCC feeder",
      "DOL",
      "star delta"
    ]
  },
  {
    id: "FAQ-134",
    category: "Technical Basics",
    question: "What does Total APFC Capacity mean?",
    answer: "Total APFC Capacity is the installed reactive-power compensation capacity of the Automatic Power Factor Correction panel, commonly expressed in kVAr. Capture the installed/nameplate value or verified stage total. Do not treat it as a live measurement of power factor.",
    keywords: [
      "APFC capacity",
      "kVAr",
      "capacitor bank"
    ]
  },
  {
    id: "FAQ-135",
    category: "Technical Basics",
    question: "Why record the number of batteries or cells in a Battery Bank?",
    answer: "The count records how many batteries or cells make up the bank and helps identify its configuration. Enter the actual installed count, using the approved counting convention for the equipment. If battery modules and cells are different in the system, clarify which count the field expects.",
    keywords: [
      "battery count",
      "number of cells",
      "battery bank"
    ]
  },
  {
    id: "FAQ-136",
    category: "Technical Basics",
    question: "What does UPS Capacity mean?",
    answer: "UPS Capacity is the manufacturer's rated output capability, commonly stated in kVA or kW. Record the rating and unit exactly as specified on the nameplate or verified documentation. Do not use the connected load as a substitute for the UPS's rated capacity.",
    keywords: [
      "UPS capacity",
      "uninterruptible power supply"
    ]
  },
  {
    id: "FAQ-137",
    category: "Technical Basics",
    question: "What do Drive Capacity and Motor Power Rating mean on a VFD?",
    answer: "Drive Capacity is the VFD's rated capability; Motor Power Rating is the rated power of the motor it is intended to control. These values may be related but are not interchangeable. Record each from the appropriate drive/motor nameplate or approved documentation.",
    keywords: [
      "VFD drive capacity",
      "motor power rating"
    ]
  },
  {
    id: "FAQ-138",
    category: "Technical Basics",
    question: "What is the difference between solar inverter AC power and maximum DC input power?",
    answer: "Rated AC Power is the inverter's specified AC output capability. Maximum DC Input Power is the maximum permitted DC input power specified by the manufacturer. Record each from the inverter nameplate or datasheet in its designated field; do not interchange DC and AC values.",
    keywords: [
      "solar inverter AC power",
      "DC input power"
    ]
  },
  {
    id: "FAQ-139",
    category: "Technical Basics",
    question: "What is a Communication Interface on industrial network equipment?",
    answer: "It identifies the supported communication connection or protocol/interface, such as Ethernet, Fiber, Serial, or Modbus where offered by the dropdown. Select the actual interface used or supported as required by the field definition and equipment documentation.",
    keywords: [
      "communication interface",
      "Ethernet",
      "Fiber",
      "Serial",
      "Modbus"
    ]
  },
  {
    id: "FAQ-140",
    category: "Technical Basics",
    question: "How do I choose Industrial Network Equipment Type?",
    answer: "Choose the installed equipment type from the approved list, which may include Router, Firewall, Media Converter, Gateway, or Other. Use the manufacturer's description or verified system documentation. Do not classify equipment by brand alone.",
    keywords: [
      "router",
      "firewall",
      "media converter",
      "gateway"
    ]
  },
  {
    id: "FAQ-141",
    category: "Technical Basics",
    question: "What is the difference between conventional and addressable fire alarm panels?",
    answer: "A conventional system typically identifies an alarm zone, while an addressable system can identify an individual addressable device or point. Select the panel type stated in the system documentation or on the approved asset record. Do not alter or test fire alarm functions outside the authorized fire-safety procedure.",
    keywords: [
      "conventional",
      "addressable fire alarm panel"
    ]
  },
  {
    id: "FAQ-142",
    category: "Technical Basics",
    question: "What does Connected Device Count mean for a Fire Alarm Panel?",
    answer: "It records the number of connected devices covered by the field's definition, such as detectors, call points, modules, or other compatible devices. Use the approved inventory or panel configuration record and follow the organization's counting convention.",
    keywords: [
      "connected device count",
      "fire alarm devices"
    ]
  },
  {
    id: "FAQ-143",
    category: "Technical Basics",
    question: "What does Protection Relay Type mean?",
    answer: "Protection Relay Type identifies the relay technology or type used in the protection scheme, as recorded in the panel documentation. Capture the name/type from the relay label or approved design records. Settings and protection coordination should be handled only by authorized protection engineers.",
    keywords: [
      "protection relay",
      "relay type",
      "protection settings"
    ]
  },
  {
    id: "FAQ-144",
    category: "Technical Basics",
    question: "Should I decide whether an earth-related voltage reading is safe from the number alone?",
    answer: "No. The acceptable interpretation depends on the measurement point, site earthing arrangement, instrument, operating condition, and approved limits. Enter the measured value accurately and escalate unexpected or potentially unsafe results to a competent electrical professional. The chatbot must not declare an installation safe based on one reading.",
    keywords: [
      "earth voltage",
      "earthing reading",
      "safe limit"
    ]
  },
  {
    id: "FAQ-145",
    category: "Technical Basics",
    question: "What should I check before entering an inspection measurement?",
    answer: "Confirm the selected asset and parameter, the correct unit and measurement point, and that the instrument is suitable and within its calibration/verification period under site policy. Measurements must be performed only by authorized personnel following the approved risk assessment and procedure.",
    keywords: [
      "measurement instrument",
      "calibration",
      "test equipment"
    ]
  },
  {
    id: "FAQ-146",
    category: "Technical Basics",
    question: "What should I do if a measured value seems abnormal?",
    answer: "Do not change the value to make it look normal. Confirm the unit and entry, follow the approved procedure for verifying the reading, and record the actual result and relevant observation. If the value indicates a potential hazard, stop the activity and notify the responsible authorized person immediately.",
    keywords: [
      "abnormal reading",
      "out of range",
      "unusual measurement"
    ]
  },
  {
    id: "FAQ-147",
    category: "Technical Basics",
    question: "What if the correct technical value is missing from a dropdown?",
    answer: "Do not select an inaccurate option merely to complete the form. Check whether an approved 'Other' option is available and use it only as intended. Record the required value in the supported notes field if permitted and raise a change request to the data owner to review the dropdown list.",
    keywords: [
      "dropdown missing value",
      "option not listed"
    ]
  },
  {
    id: "FAQ-148",
    category: "Technical Basics",
    question: "When should I select the asset type 'Other'?",
    answer: "Use Other only when the installed equipment does not match any available approved asset category. Enter the equipment description and available ratings in the designated fields and provide a clear photograph. Request category review if the equipment is expected to be common or should have its own checklist.",
    keywords: [
      "asset type other",
      "category missing"
    ]
  },
  {
    id: "FAQ-149",
    category: "Technical Basics",
    question: "Why do inspection parameters differ by asset category?",
    answer: "Different equipment types have different ratings, functions, and inspection needs. EVITA therefore presents a category-specific parameter set—for example, phase currents for many three-phase panels, battery voltage/current for a battery bank, or network/interface details for communication equipment. Record only the fields shown for the selected asset and approved checklist.",
    keywords: [
      "asset specific checklist",
      "different parameters",
      "category parameters"
    ]
  },
  {
    id: "FAQ-150",
    category: "Technical Basics",
    question: "Should I enter an expected or nominal value when I cannot take a measurement?",
    answer: "No. The inspection field is intended to capture the actual value when measured. Do not copy the rated or nominal value into a measured-value field. If measurement cannot be performed, follow the approved incomplete-measurement workflow and document the reason.",
    keywords: [
      "nominal value",
      "measured value unavailable"
    ]
  },
  {
    id: "FAQ-151",
    category: "Technical Basics",
    question: "Should I record the operating condition when taking a measurement?",
    answer: "Where the app provides an observation or notes field, record relevant context such as whether the equipment was operating and any approved load/condition information. Measurements can vary with operating state, so context helps technical reviewers interpret them. Do not change equipment operating conditions unless authorized.",
    keywords: [
      "operating condition",
      "load condition",
      "measurement context"
    ]
  },
  {
    id: "FAQ-152",
    category: "Technical Basics",
    question: "The app label says 'Body Earth Volatge'. Is this a different parameter?",
    answer: "It appears to be a spelling error for 'Body Earth Voltage', not a separate technical parameter. Use the field as defined in the approved inspection matrix, and report the typo to the product team so it can be corrected consistently in the app and knowledge base.",
    keywords: [
      "Body Earth Volatge typo",
      "body earth voltage"
    ]
  },
  {
    id: "FAQ-153",
    category: "Asset Technical Parameters – ACB (Air Circuit Breaker)",
    question: "For ACB (Air Circuit Breaker), what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For ACB (Air Circuit Breaker), **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures breaker rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "ACB (Air Circuit Breaker); Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-154",
    category: "Asset Technical Parameters – ACB (Air Circuit Breaker)",
    question: "For ACB (Air Circuit Breaker), what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For ACB (Air Circuit Breaker), **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures frame/rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "ACB (Air Circuit Breaker); Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-155",
    category: "Asset Technical Parameters – ACB (Air Circuit Breaker)",
    question: "For ACB (Air Circuit Breaker), what does the 'Breaking Capacity' onboarding field mean and how should I fill it?",
    answer: "For ACB (Air Circuit Breaker), **Breaking Capacity** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate. The unit shown in the parameter sheet is kA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "ACB (Air Circuit Breaker); Breaking Capacity; onboarding; technical parameter; kA"
    ]
  },
  {
    id: "FAQ-156",
    category: "Asset Technical Parameters – ACB (Air Circuit Breaker)",
    question: "For ACB (Air Circuit Breaker), what does the 'Pole Configuration' onboarding field mean and how should I fill it?",
    answer: "For ACB (Air Circuit Breaker), **Pole Configuration** is marked mandatory in the supplied onboarding parameter matrix. This field captures 2p/ 3p / 4p. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "ACB (Air Circuit Breaker); Pole Configuration; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-157",
    category: "Asset Technical Parameters – AMF Panel",
    question: "For AMF Panel, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For AMF Panel, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "AMF Panel; Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-158",
    category: "Asset Technical Parameters – AMF Panel",
    question: "For AMF Panel, what does the 'Generator Rating' onboarding field mean and how should I fill it?",
    answer: "For AMF Panel, **Generator Rating** is marked optional in the supplied onboarding parameter matrix. This field captures connected dg rating. The unit shown in the parameter sheet is kVA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "AMF Panel; Generator Rating; onboarding; technical parameter; kVA"
    ]
  },
  {
    id: "FAQ-159",
    category: "Asset Technical Parameters – AMF Panel",
    question: "For AMF Panel, what does the 'Controller Make/Model' onboarding field mean and how should I fill it?",
    answer: "For AMF Panel, **Controller Make/Model** is marked optional in the supplied onboarding parameter matrix. This field captures amf controller. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "AMF Panel; Controller Make/Model; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-160",
    category: "Asset Technical Parameters – APFC Panel",
    question: "For APFC Panel, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For APFC Panel, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "APFC Panel; Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-161",
    category: "Asset Technical Parameters – APFC Panel",
    question: "For APFC Panel, what does the 'Total APFC Capacity' onboarding field mean and how should I fill it?",
    answer: "For APFC Panel, **Total APFC Capacity** is marked mandatory in the supplied onboarding parameter matrix. This field captures installed bank capacity. The unit shown in the parameter sheet is kVAr. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "APFC Panel; Total APFC Capacity; onboarding; technical parameter; kVAr"
    ]
  },
  {
    id: "FAQ-162",
    category: "Asset Technical Parameters – APFC Panel",
    question: "For APFC Panel, what does the 'Controller Make/Model' onboarding field mean and how should I fill it?",
    answer: "For APFC Panel, **Controller Make/Model** is marked optional in the supplied onboarding parameter matrix. This field captures apfc relay/controller. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "APFC Panel; Controller Make/Model; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-163",
    category: "Asset Technical Parameters – Battery Bank",
    question: "For Battery Bank, what does the 'Nominal Bank Voltage' onboarding field mean and how should I fill it?",
    answer: "For Battery Bank, **Nominal Bank Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures bank nominal voltage. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Battery Bank; Nominal Bank Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-164",
    category: "Asset Technical Parameters – Battery Bank",
    question: "For Battery Bank, what does the 'Number of Batteries / Cells' onboarding field mean and how should I fill it?",
    answer: "For Battery Bank, **Number of Batteries / Cells** is marked mandatory in the supplied onboarding parameter matrix. This field captures installed quantity. The unit shown in the parameter sheet is Nos.. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Battery Bank; Number of Batteries / Cells; onboarding; technical parameter; Nos."
    ]
  },
  {
    id: "FAQ-165",
    category: "Asset Technical Parameters – Battery Bank",
    question: "For Battery Bank, what does the 'Unit Ah Capacity' onboarding field mean and how should I fill it?",
    answer: "For Battery Bank, **Unit Ah Capacity** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate capacity. The unit shown in the parameter sheet is Ah. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Battery Bank; Unit Ah Capacity; onboarding; technical parameter; Ah"
    ]
  },
  {
    id: "FAQ-166",
    category: "Asset Technical Parameters – Battery Charger",
    question: "For Battery Charger, what does the 'Charger Capacity' onboarding field mean and how should I fill it?",
    answer: "For Battery Charger, **Charger Capacity** is marked mandatory in the supplied onboarding parameter matrix. This field captures rated dc output current. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Battery Charger; Charger Capacity; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-167",
    category: "Asset Technical Parameters – Battery Charger",
    question: "For Battery Charger, what does the 'Input Voltage' onboarding field mean and how should I fill it?",
    answer: "For Battery Charger, **Input Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures ac input rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Battery Charger; Input Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-168",
    category: "Asset Technical Parameters – Battery Charger",
    question: "For Battery Charger, what does the 'Output Voltage' onboarding field mean and how should I fill it?",
    answer: "For Battery Charger, **Output Voltage** is marked optional in the supplied onboarding parameter matrix. This field captures dc output rating. The unit shown in the parameter sheet is V DC. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Battery Charger; Output Voltage; onboarding; technical parameter; V DC"
    ]
  },
  {
    id: "FAQ-169",
    category: "Asset Technical Parameters – Battery Charger",
    question: "For Battery Charger, what does the 'Battery Bank Voltage' onboarding field mean and how should I fill it?",
    answer: "For Battery Charger, **Battery Bank Voltage** is marked optional in the supplied onboarding parameter matrix. This field captures connected battery bank. The unit shown in the parameter sheet is V DC. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Battery Charger; Battery Bank Voltage; onboarding; technical parameter; V DC"
    ]
  },
  {
    id: "FAQ-170",
    category: "Asset Technical Parameters – Busbar",
    question: "For Busbar, what does the 'Busbar Rating' onboarding field mean and how should I fill it?",
    answer: "For Busbar, **Busbar Rating** is marked mandatory in the supplied onboarding parameter matrix. This field captures continuous current rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Busbar; Busbar Rating; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-171",
    category: "Asset Technical Parameters – Busbar",
    question: "For Busbar, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For Busbar, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures system voltage. The unit shown in the parameter sheet is V/kV. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Busbar; Rated Voltage; onboarding; technical parameter; V/kV"
    ]
  },
  {
    id: "FAQ-172",
    category: "Asset Technical Parameters – Busbar",
    question: "For Busbar, what does the 'Material' onboarding field mean and how should I fill it?",
    answer: "For Busbar, **Material** is marked mandatory in the supplied onboarding parameter matrix. This field captures copper / aluminium. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Busbar; Material; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-173",
    category: "Asset Technical Parameters – Busbar",
    question: "For Busbar, what does the 'Busbar Type' onboarding field mean and how should I fill it?",
    answer: "For Busbar, **Busbar Type** is marked mandatory in the supplied onboarding parameter matrix. This field captures open / enclosed / busduct. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Busbar; Busbar Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-174",
    category: "Asset Technical Parameters – Control Panel",
    question: "For Control Panel, what does the 'Control Voltage' onboarding field mean and how should I fill it?",
    answer: "For Control Panel, **Control Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures control supply. The unit shown in the parameter sheet is V DC/AC. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Control Panel; Control Voltage; onboarding; technical parameter; V DC/AC"
    ]
  },
  {
    id: "FAQ-175",
    category: "Asset Technical Parameters – Control Panel",
    question: "For Control Panel, what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For Control Panel, **Rated Current** is marked optional in the supplied onboarding parameter matrix. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Control Panel; Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-176",
    category: "Asset Technical Parameters – Control Panel",
    question: "For Control Panel, what does the 'PLC/Controller Present' onboarding field mean and how should I fill it?",
    answer: "For Control Panel, **PLC/Controller Present** is marked mandatory in the supplied onboarding parameter matrix. This field captures yes / no. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Control Panel; PLC/Controller Present; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-177",
    category: "Asset Technical Parameters – Distribution Board (DB)",
    question: "For Distribution Board (DB), what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For Distribution Board (DB), **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures db rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Board (DB); Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-178",
    category: "Asset Technical Parameters – Distribution Board (DB)",
    question: "For Distribution Board (DB), what does the 'Incomer Rating' onboarding field mean and how should I fill it?",
    answer: "For Distribution Board (DB), **Incomer Rating** is marked mandatory in the supplied onboarding parameter matrix. This field captures main incomer rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Board (DB); Incomer Rating; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-179",
    category: "Asset Technical Parameters – Distribution Board (DB)",
    question: "For Distribution Board (DB), what does the 'Enclosure IP Rating' onboarding field mean and how should I fill it?",
    answer: "For Distribution Board (DB), **Enclosure IP Rating** is marked optional in the supplied onboarding parameter matrix. This field captures as per nameplate/design. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Board (DB); Enclosure IP Rating; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-180",
    category: "Asset Technical Parameters – Distribution Transformer",
    question: "For Distribution Transformer, what does the 'Rated Power' onboarding field mean and how should I fill it?",
    answer: "For Distribution Transformer, **Rated Power** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate rating. The unit shown in the parameter sheet is kVA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Transformer; Rated Power; onboarding; technical parameter; kVA"
    ]
  },
  {
    id: "FAQ-181",
    category: "Asset Technical Parameters – Distribution Transformer",
    question: "For Distribution Transformer, what does the 'HV / LV Voltage' onboarding field mean and how should I fill it?",
    answer: "For Distribution Transformer, **HV / LV Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures voltage ratio. The unit shown in the parameter sheet is kV/V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Transformer; HV / LV Voltage; onboarding; technical parameter; kV/V"
    ]
  },
  {
    id: "FAQ-182",
    category: "Asset Technical Parameters – Distribution Transformer",
    question: "For Distribution Transformer, what does the 'Phase' onboarding field mean and how should I fill it?",
    answer: "For Distribution Transformer, **Phase** is marked mandatory in the supplied onboarding parameter matrix. This field captures 3-phase / 1-phase. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Transformer; Phase; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-183",
    category: "Asset Technical Parameters – Distribution Transformer",
    question: "For Distribution Transformer, what does the 'Impedance' onboarding field mean and how should I fill it?",
    answer: "For Distribution Transformer, **Impedance** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate value. The unit shown in the parameter sheet is %. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using nameplate value as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Transformer; Impedance; onboarding; technical parameter; %"
    ]
  },
  {
    id: "FAQ-184",
    category: "Asset Technical Parameters – Distribution Transformer",
    question: "For Distribution Transformer, what does the 'Cooling Type' onboarding field mean and how should I fill it?",
    answer: "For Distribution Transformer, **Cooling Type** is marked optional in the supplied onboarding parameter matrix. This field captures onan / onaf / ofaf / ofwf / dry type / other. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Transformer; Cooling Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-185",
    category: "Asset Technical Parameters – Distribution Transformer",
    question: "For Distribution Transformer, what does the 'Vector Group' onboarding field mean and how should I fill it?",
    answer: "For Distribution Transformer, **Vector Group** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate value. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Distribution Transformer; Vector Group; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-186",
    category: "Asset Technical Parameters – Fire Alarm Panel",
    question: "For Fire Alarm Panel, what does the 'Panel Type' onboarding field mean and how should I fill it?",
    answer: "For Fire Alarm Panel, **Panel Type** is marked mandatory in the supplied onboarding parameter matrix. This field captures conventional / addressable. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Fire Alarm Panel; Panel Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-187",
    category: "Asset Technical Parameters – Fire Alarm Panel",
    question: "For Fire Alarm Panel, what does the 'Connected Device Count' onboarding field mean and how should I fill it?",
    answer: "For Fire Alarm Panel, **Connected Device Count** is marked optional in the supplied onboarding parameter matrix. This field captures detectors/modules/manual call points. The unit shown in the parameter sheet is Nos.. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Fire Alarm Panel; Connected Device Count; onboarding; technical parameter; Nos."
    ]
  },
  {
    id: "FAQ-188",
    category: "Asset Technical Parameters – HT Panel",
    question: "For HT Panel, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For HT Panel, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate rating. The unit shown in the parameter sheet is kV. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "HT Panel; Rated Voltage; onboarding; technical parameter; kV"
    ]
  },
  {
    id: "FAQ-189",
    category: "Asset Technical Parameters – HT Panel",
    question: "For HT Panel, what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For HT Panel, **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures busbar/incomer rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "HT Panel; Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-190",
    category: "Asset Technical Parameters – HT Panel",
    question: "For HT Panel, what does the 'Incomer Arrangement' onboarding field mean and how should I fill it?",
    answer: "For HT Panel, **Incomer Arrangement** is marked mandatory in the supplied onboarding parameter matrix. This field captures vcb / sf6 / acb / other. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "HT Panel; Incomer Arrangement; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-191",
    category: "Asset Technical Parameters – HT Panel",
    question: "For HT Panel, what does the 'Protection Relay Type' onboarding field mean and how should I fill it?",
    answer: "For HT Panel, **Protection Relay Type** is marked optional in the supplied onboarding parameter matrix. This field captures installed relay make/model. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "HT Panel; Protection Relay Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-192",
    category: "Asset Technical Parameters – Industrial Network Equipment",
    question: "For Industrial Network Equipment, what does the 'Equipment Type' onboarding field mean and how should I fill it?",
    answer: "For Industrial Network Equipment, **Equipment Type** is marked mandatory in the supplied onboarding parameter matrix. This field captures router / firewall / media converter / gateway / other. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Industrial Network Equipment; Equipment Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-193",
    category: "Asset Technical Parameters – Industrial Network Equipment",
    question: "For Industrial Network Equipment, what does the 'Make/Model' onboarding field mean and how should I fill it?",
    answer: "For Industrial Network Equipment, **Make/Model** is marked optional in the supplied onboarding parameter matrix. This field captures oem details. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Industrial Network Equipment; Make/Model; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-194",
    category: "Asset Technical Parameters – Industrial Network Equipment",
    question: "For Industrial Network Equipment, what does the 'Supply Voltage' onboarding field mean and how should I fill it?",
    answer: "For Industrial Network Equipment, **Supply Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures power supply. The unit shown in the parameter sheet is V DC/AC. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Industrial Network Equipment; Supply Voltage; onboarding; technical parameter; V DC/AC"
    ]
  },
  {
    id: "FAQ-195",
    category: "Asset Technical Parameters – Industrial Network Equipment",
    question: "For Industrial Network Equipment, what does the 'Communication Interface' onboarding field mean and how should I fill it?",
    answer: "For Industrial Network Equipment, **Communication Interface** is marked mandatory in the supplied onboarding parameter matrix. This field captures ethernet/fiber/serial/modbus/other. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Industrial Network Equipment; Communication Interface; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-196",
    category: "Asset Technical Parameters – Instrument Transformer (CT/PT)",
    question: "For Instrument Transformer (CT/PT), what does the 'Instrument Type' onboarding field mean and how should I fill it?",
    answer: "For Instrument Transformer (CT/PT), **Instrument Type** is marked mandatory in the supplied onboarding parameter matrix. This field captures ct / pt / ct+pt. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Instrument Transformer (CT/PT); Instrument Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-197",
    category: "Asset Technical Parameters – Instrument Transformer (CT/PT)",
    question: "For Instrument Transformer (CT/PT), what does the 'Primary Rating' onboarding field mean and how should I fill it?",
    answer: "For Instrument Transformer (CT/PT), **Primary Rating** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate. The unit shown in the parameter sheet is A or kV. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Instrument Transformer (CT/PT); Primary Rating; onboarding; technical parameter; A or kV"
    ]
  },
  {
    id: "FAQ-198",
    category: "Asset Technical Parameters – Instrument Transformer (CT/PT)",
    question: "For Instrument Transformer (CT/PT), what does the 'Secondary Rating' onboarding field mean and how should I fill it?",
    answer: "For Instrument Transformer (CT/PT), **Secondary Rating** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate. The unit shown in the parameter sheet is A or V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Instrument Transformer (CT/PT); Secondary Rating; onboarding; technical parameter; A or V"
    ]
  },
  {
    id: "FAQ-199",
    category: "Asset Technical Parameters – Instrument Transformer (CT/PT)",
    question: "For Instrument Transformer (CT/PT), what does the 'Accuracy Class' onboarding field mean and how should I fill it?",
    answer: "For Instrument Transformer (CT/PT), **Accuracy Class** is marked optional in the supplied onboarding parameter matrix. This field captures metering/protection class. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Instrument Transformer (CT/PT); Accuracy Class; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-200",
    category: "Asset Technical Parameters – Instrument Transformer (CT/PT)",
    question: "For Instrument Transformer (CT/PT), what does the 'Core / Ratio Details' onboarding field mean and how should I fill it?",
    answer: "For Instrument Transformer (CT/PT), **Core / Ratio Details** is marked optional in the supplied onboarding parameter matrix. This field captures core count and ratios. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Instrument Transformer (CT/PT); Core / Ratio Details; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-201",
    category: "Asset Technical Parameters – Inverter",
    question: "For Inverter, what does the 'Rated Power' onboarding field mean and how should I fill it?",
    answer: "For Inverter, **Rated Power** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate rating. The unit shown in the parameter sheet is kVA/MVA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Inverter; Rated Power; onboarding; technical parameter; kVA/MVA"
    ]
  },
  {
    id: "FAQ-202",
    category: "Asset Technical Parameters – Inverter",
    question: "For Inverter, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For Inverter, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using panel rating as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Inverter; Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-203",
    category: "Asset Technical Parameters – Lighting Distribution Board (LDB)",
    question: "For Lighting Distribution Board (LDB), what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For Lighting Distribution Board (LDB), **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures ldb rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Lighting Distribution Board (LDB); Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-204",
    category: "Asset Technical Parameters – Lighting Distribution Board (LDB)",
    question: "For Lighting Distribution Board (LDB), what does the 'Incomer Rating' onboarding field mean and how should I fill it?",
    answer: "For Lighting Distribution Board (LDB), **Incomer Rating** is marked mandatory in the supplied onboarding parameter matrix. This field captures main incomer rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Lighting Distribution Board (LDB); Incomer Rating; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-205",
    category: "Asset Technical Parameters – Lighting Distribution Board (LDB)",
    question: "For Lighting Distribution Board (LDB), what does the 'Outgoing Way Count' onboarding field mean and how should I fill it?",
    answer: "For Lighting Distribution Board (LDB), **Outgoing Way Count** is marked optional in the supplied onboarding parameter matrix. This field captures lighting circuits. The unit shown in the parameter sheet is Nos.. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Lighting Distribution Board (LDB); Outgoing Way Count; onboarding; technical parameter; Nos."
    ]
  },
  {
    id: "FAQ-206",
    category: "Asset Technical Parameters – LT Panel",
    question: "For LT Panel, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For LT Panel, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "LT Panel; Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-207",
    category: "Asset Technical Parameters – LT Panel",
    question: "For LT Panel, what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For LT Panel, **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel/busbar rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "LT Panel; Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-208",
    category: "Asset Technical Parameters – LT Panel",
    question: "For LT Panel, what does the 'Incomer Type' onboarding field mean and how should I fill it?",
    answer: "For LT Panel, **Incomer Type** is marked mandatory in the supplied onboarding parameter matrix. This field captures acb / mccb / switch fuse / other. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "LT Panel; Incomer Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-209",
    category: "Asset Technical Parameters – LT Panel",
    question: "For LT Panel, what does the 'Busbar Material / Rating' onboarding field mean and how should I fill it?",
    answer: "For LT Panel, **Busbar Material / Rating** is marked mandatory in the supplied onboarding parameter matrix. This field captures copper / aluminium. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "LT Panel; Busbar Material / Rating; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-210",
    category: "Asset Technical Parameters – MCC (Motor Control Center)",
    question: "For MCC (Motor Control Center), what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For MCC (Motor Control Center), **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCC (Motor Control Center); Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-211",
    category: "Asset Technical Parameters – MCC (Motor Control Center)",
    question: "For MCC (Motor Control Center), what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For MCC (Motor Control Center), **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCC (Motor Control Center); Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-212",
    category: "Asset Technical Parameters – MCC (Motor Control Center)",
    question: "For MCC (Motor Control Center), what does the 'Busbar Rating' onboarding field mean and how should I fill it?",
    answer: "For MCC (Motor Control Center), **Busbar Rating** is marked optional in the supplied onboarding parameter matrix. This field captures busbar rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCC (Motor Control Center); Busbar Rating; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-213",
    category: "Asset Technical Parameters – MCC (Motor Control Center)",
    question: "For MCC (Motor Control Center), what does the 'Number of Motor Feeders' onboarding field mean and how should I fill it?",
    answer: "For MCC (Motor Control Center), **Number of Motor Feeders** is marked optional in the supplied onboarding parameter matrix. This field captures installed feeder count. The unit shown in the parameter sheet is Nos.. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCC (Motor Control Center); Number of Motor Feeders; onboarding; technical parameter; Nos."
    ]
  },
  {
    id: "FAQ-214",
    category: "Asset Technical Parameters – MCC (Motor Control Center)",
    question: "For MCC (Motor Control Center), what does the 'Motor Starter Technology' onboarding field mean and how should I fill it?",
    answer: "For MCC (Motor Control Center), **Motor Starter Technology** is marked mandatory in the supplied onboarding parameter matrix. This field captures dol / star-delta / soft starter / vfd / mixed. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCC (Motor Control Center); Motor Starter Technology; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-215",
    category: "Asset Technical Parameters – MCCB",
    question: "For MCCB, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For MCCB, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures breaker rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCCB; Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-216",
    category: "Asset Technical Parameters – MCCB",
    question: "For MCCB, what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For MCCB, **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures current. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCCB; Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-217",
    category: "Asset Technical Parameters – MCCB",
    question: "For MCCB, what does the 'Trip Rating' onboarding field mean and how should I fill it?",
    answer: "For MCCB, **Trip Rating** is marked optional in the supplied onboarding parameter matrix. This field captures trip setting/rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCCB; Trip Rating; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-218",
    category: "Asset Technical Parameters – MCCB",
    question: "For MCCB, what does the 'Breaking Capacity' onboarding field mean and how should I fill it?",
    answer: "For MCCB, **Breaking Capacity** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate. The unit shown in the parameter sheet is kA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCCB; Breaking Capacity; onboarding; technical parameter; kA"
    ]
  },
  {
    id: "FAQ-219",
    category: "Asset Technical Parameters – MCCB",
    question: "For MCCB, what does the 'Pole Configuration' onboarding field mean and how should I fill it?",
    answer: "For MCCB, **Pole Configuration** is marked mandatory in the supplied onboarding parameter matrix. This field captures 2p / 3p / 4p. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "MCCB; Pole Configuration; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-220",
    category: "Asset Technical Parameters – Network Switch",
    question: "For Network Switch, what does the 'Switch Type' onboarding field mean and how should I fill it?",
    answer: "For Network Switch, **Switch Type** is marked optional in the supplied onboarding parameter matrix. This field captures managed / unmanaged. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Network Switch; Switch Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-221",
    category: "Asset Technical Parameters – Network Switch",
    question: "For Network Switch, what does the 'Power Supply' onboarding field mean and how should I fill it?",
    answer: "For Network Switch, **Power Supply** is marked mandatory in the supplied onboarding parameter matrix. This field captures supply details. The unit shown in the parameter sheet is V DC/AC. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Network Switch; Power Supply; onboarding; technical parameter; V DC/AC"
    ]
  },
  {
    id: "FAQ-222",
    category: "Asset Technical Parameters – Other",
    question: "For Other, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For Other, **Rated Voltage** is marked optional in the supplied onboarding parameter matrix. This field captures if applicable. The unit shown in the parameter sheet is V/kV. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Other; Rated Voltage; onboarding; technical parameter; V/kV"
    ]
  },
  {
    id: "FAQ-223",
    category: "Asset Technical Parameters – Other",
    question: "For Other, what does the 'Rated Power / Current' onboarding field mean and how should I fill it?",
    answer: "For Other, **Rated Power / Current** is marked optional in the supplied onboarding parameter matrix. This field captures if applicable. The unit shown in the parameter sheet is kW/kVA/A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Other; Rated Power / Current; onboarding; technical parameter; kW/kVA/A"
    ]
  },
  {
    id: "FAQ-224",
    category: "Asset Technical Parameters – PCC (Power Control Center)",
    question: "For PCC (Power Control Center), what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For PCC (Power Control Center), **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "PCC (Power Control Center); Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-225",
    category: "Asset Technical Parameters – PCC (Power Control Center)",
    question: "For PCC (Power Control Center), what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For PCC (Power Control Center), **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using panel rating as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "PCC (Power Control Center); Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-226",
    category: "Asset Technical Parameters – PCC (Power Control Center)",
    question: "For PCC (Power Control Center), what does the 'Short Circuit Rating' onboarding field mean and how should I fill it?",
    answer: "For PCC (Power Control Center), **Short Circuit Rating** is marked mandatory in the supplied onboarding parameter matrix. This field captures as per design/nameplate. The unit shown in the parameter sheet is kA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "PCC (Power Control Center); Short Circuit Rating; onboarding; technical parameter; kA"
    ]
  },
  {
    id: "FAQ-227",
    category: "Asset Technical Parameters – PLC Panel",
    question: "For PLC Panel, what does the 'PLC Make/Model' onboarding field mean and how should I fill it?",
    answer: "For PLC Panel, **PLC Make/Model** is marked mandatory in the supplied onboarding parameter matrix. This field captures cpu/controller make and model. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "PLC Panel; PLC Make/Model; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-228",
    category: "Asset Technical Parameters – PLC Panel",
    question: "For PLC Panel, what does the 'Supply Voltage' onboarding field mean and how should I fill it?",
    answer: "For PLC Panel, **Supply Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures panel/control supply. The unit shown in the parameter sheet is V DC/AC. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "PLC Panel; Supply Voltage; onboarding; technical parameter; V DC/AC"
    ]
  },
  {
    id: "FAQ-229",
    category: "Asset Technical Parameters – Power Transformer",
    question: "For Power Transformer, what does the 'Rated Power' onboarding field mean and how should I fill it?",
    answer: "For Power Transformer, **Rated Power** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate rating. The unit shown in the parameter sheet is MVA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Power Transformer; Rated Power; onboarding; technical parameter; MVA"
    ]
  },
  {
    id: "FAQ-230",
    category: "Asset Technical Parameters – Power Transformer",
    question: "For Power Transformer, what does the 'HV / LV Voltage' onboarding field mean and how should I fill it?",
    answer: "For Power Transformer, **HV / LV Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures voltage ratio. The unit shown in the parameter sheet is kV/V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Power Transformer; HV / LV Voltage; onboarding; technical parameter; kV/V"
    ]
  },
  {
    id: "FAQ-231",
    category: "Asset Technical Parameters – Power Transformer",
    question: "For Power Transformer, what does the 'Phase' onboarding field mean and how should I fill it?",
    answer: "For Power Transformer, **Phase** is marked mandatory in the supplied onboarding parameter matrix. This field captures 1 phase / 3 phase. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Power Transformer; Phase; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-232",
    category: "Asset Technical Parameters – Power Transformer",
    question: "For Power Transformer, what does the 'Vector Group' onboarding field mean and how should I fill it?",
    answer: "For Power Transformer, **Vector Group** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate value. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Power Transformer; Vector Group; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-233",
    category: "Asset Technical Parameters – Power Transformer",
    question: "For Power Transformer, what does the 'Cooling Type' onboarding field mean and how should I fill it?",
    answer: "For Power Transformer, **Cooling Type** is marked optional in the supplied onboarding parameter matrix. This field captures onan / onaf / ofaf / ofwf / dry type / other. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Power Transformer; Cooling Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-234",
    category: "Asset Technical Parameters – Power Transformer",
    question: "For Power Transformer, what does the 'Impedance' onboarding field mean and how should I fill it?",
    answer: "For Power Transformer, **Impedance** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate value. The unit shown in the parameter sheet is %. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Power Transformer; Impedance; onboarding; technical parameter; %"
    ]
  },
  {
    id: "FAQ-235",
    category: "Asset Technical Parameters – Power Transformer",
    question: "For Power Transformer, what does the 'Tap Changer Type' onboarding field mean and how should I fill it?",
    answer: "For Power Transformer, **Tap Changer Type** is marked optional in the supplied onboarding parameter matrix. This field captures oltc / off-circuit / none. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Power Transformer; Tap Changer Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-236",
    category: "Asset Technical Parameters – Relay Panel",
    question: "For Relay Panel, what does the 'System Voltage' onboarding field mean and how should I fill it?",
    answer: "For Relay Panel, **System Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures protected system voltage. The unit shown in the parameter sheet is V/kV. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Relay Panel; System Voltage; onboarding; technical parameter; V/kV"
    ]
  },
  {
    id: "FAQ-237",
    category: "Asset Technical Parameters – Relay Panel",
    question: "For Relay Panel, what does the 'Relay Make/Model' onboarding field mean and how should I fill it?",
    answer: "For Relay Panel, **Relay Make/Model** is marked optional in the supplied onboarding parameter matrix. This field captures key relay details. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Relay Panel; Relay Make/Model; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-238",
    category: "Asset Technical Parameters – RTU (Remote Terminal Unit)",
    question: "For RTU (Remote Terminal Unit), what does the 'Supply Voltage' onboarding field mean and how should I fill it?",
    answer: "For RTU (Remote Terminal Unit), **Supply Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures rtu supply. The unit shown in the parameter sheet is V DC. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "RTU (Remote Terminal Unit); Supply Voltage; onboarding; technical parameter; V DC"
    ]
  },
  {
    id: "FAQ-239",
    category: "Asset Technical Parameters – SF6 Circuit Breaker",
    question: "For SF6 Circuit Breaker, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For SF6 Circuit Breaker, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures breaker rating. The unit shown in the parameter sheet is kV. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "SF6 Circuit Breaker; Rated Voltage; onboarding; technical parameter; kV"
    ]
  },
  {
    id: "FAQ-240",
    category: "Asset Technical Parameters – SF6 Circuit Breaker",
    question: "For SF6 Circuit Breaker, what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For SF6 Circuit Breaker, **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures breaker rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "SF6 Circuit Breaker; Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-241",
    category: "Asset Technical Parameters – SF6 Circuit Breaker",
    question: "For SF6 Circuit Breaker, what does the 'Breaking Capacity' onboarding field mean and how should I fill it?",
    answer: "For SF6 Circuit Breaker, **Breaking Capacity** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate. The unit shown in the parameter sheet is kA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "SF6 Circuit Breaker; Breaking Capacity; onboarding; technical parameter; kA"
    ]
  },
  {
    id: "FAQ-242",
    category: "Asset Technical Parameters – Soft Starter Panel",
    question: "For Soft Starter Panel, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For Soft Starter Panel, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures starter/panel rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Soft Starter Panel; Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-243",
    category: "Asset Technical Parameters – Soft Starter Panel",
    question: "For Soft Starter Panel, what does the 'Motor Power Rating' onboarding field mean and how should I fill it?",
    answer: "For Soft Starter Panel, **Motor Power Rating** is marked optional in the supplied onboarding parameter matrix. This field captures connected motor. The unit shown in the parameter sheet is kW. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Soft Starter Panel; Motor Power Rating; onboarding; technical parameter; kW"
    ]
  },
  {
    id: "FAQ-244",
    category: "Asset Technical Parameters – Soft Starter Panel",
    question: "For Soft Starter Panel, what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For Soft Starter Panel, **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures starter rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Soft Starter Panel; Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-245",
    category: "Asset Technical Parameters – Solar Combiner Box",
    question: "For Solar Combiner Box, what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For Solar Combiner Box, **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures input/output rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using input/output rating as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Solar Combiner Box; Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-246",
    category: "Asset Technical Parameters – Solar Combiner Box",
    question: "For Solar Combiner Box, what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For Solar Combiner Box, **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures input/output rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Solar Combiner Box; Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-247",
    category: "Asset Technical Parameters – Solar Inverter",
    question: "For Solar Inverter, what does the 'Rated AC Power' onboarding field mean and how should I fill it?",
    answer: "For Solar Inverter, **Rated AC Power** is marked mandatory in the supplied onboarding parameter matrix. This field captures inverter rating. The unit shown in the parameter sheet is kW. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Solar Inverter; Rated AC Power; onboarding; technical parameter; kW"
    ]
  },
  {
    id: "FAQ-248",
    category: "Asset Technical Parameters – Solar Inverter",
    question: "For Solar Inverter, what does the 'Max DC Input Power' onboarding field mean and how should I fill it?",
    answer: "For Solar Inverter, **Max DC Input Power** is marked mandatory in the supplied onboarding parameter matrix. This field captures pv input rating. The unit shown in the parameter sheet is kWp. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Solar Inverter; Max DC Input Power; onboarding; technical parameter; kWp"
    ]
  },
  {
    id: "FAQ-249",
    category: "Asset Technical Parameters – Solar Inverter",
    question: "For Solar Inverter, what does the 'Grid Voltage' onboarding field mean and how should I fill it?",
    answer: "For Solar Inverter, **Grid Voltage** is marked optional in the supplied onboarding parameter matrix. This field captures ac grid voltage. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Solar Inverter; Grid Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-250",
    category: "Asset Technical Parameters – Sub Distribution Board (SDB)",
    question: "For Sub Distribution Board (SDB), what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For Sub Distribution Board (SDB), **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures sdb rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Sub Distribution Board (SDB); Rated Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-251",
    category: "Asset Technical Parameters – Sub Distribution Board (SDB)",
    question: "For Sub Distribution Board (SDB), what does the 'Incomer Rating' onboarding field mean and how should I fill it?",
    answer: "For Sub Distribution Board (SDB), **Incomer Rating** is marked mandatory in the supplied onboarding parameter matrix. This field captures main incomer rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Sub Distribution Board (SDB); Incomer Rating; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-252",
    category: "Asset Technical Parameters – Transformer",
    question: "For Transformer, what does the 'Rated Power' onboarding field mean and how should I fill it?",
    answer: "For Transformer, **Rated Power** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate rating. The unit shown in the parameter sheet is kVA/MVA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Transformer; Rated Power; onboarding; technical parameter; kVA/MVA"
    ]
  },
  {
    id: "FAQ-253",
    category: "Asset Technical Parameters – Transformer",
    question: "For Transformer, what does the 'HV / LV Voltage' onboarding field mean and how should I fill it?",
    answer: "For Transformer, **HV / LV Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures primary and secondary rated voltage. The unit shown in the parameter sheet is kV/V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Transformer; HV / LV Voltage; onboarding; technical parameter; kV/V"
    ]
  },
  {
    id: "FAQ-254",
    category: "Asset Technical Parameters – Transformer",
    question: "For Transformer, what does the 'Phase' onboarding field mean and how should I fill it?",
    answer: "For Transformer, **Phase** is marked mandatory in the supplied onboarding parameter matrix. This field captures 1-phase / 3-phase. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Transformer; Phase; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-255",
    category: "Asset Technical Parameters – Transformer",
    question: "For Transformer, what does the 'Cooling Type' onboarding field mean and how should I fill it?",
    answer: "For Transformer, **Cooling Type** is marked optional in the supplied onboarding parameter matrix. This field captures onan / onaf / ofaf / ofwf / dry type / other. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using dropdown as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Transformer; Cooling Type; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-256",
    category: "Asset Technical Parameters – Transformer",
    question: "For Transformer, what does the 'Vector Group' onboarding field mean and how should I fill it?",
    answer: "For Transformer, **Vector Group** is marked optional in the supplied onboarding parameter matrix. This field captures as per nameplate. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Transformer; Vector Group; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-257",
    category: "Asset Technical Parameters – Transformer",
    question: "For Transformer, what does the 'Impedance' onboarding field mean and how should I fill it?",
    answer: "For Transformer, **Impedance** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate impedance. The unit shown in the parameter sheet is %. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Transformer; Impedance; onboarding; technical parameter; %"
    ]
  },
  {
    id: "FAQ-258",
    category: "Asset Technical Parameters – Transformer",
    question: "For Transformer, what does the 'Insulation / Temperature Class' onboarding field mean and how should I fill it?",
    answer: "For Transformer, **Insulation / Temperature Class** is marked optional in the supplied onboarding parameter matrix. This field captures as per oem. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "Transformer; Insulation / Temperature Class; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-259",
    category: "Asset Technical Parameters – UPS",
    question: "For UPS, what does the 'UPS Capacity' onboarding field mean and how should I fill it?",
    answer: "For UPS, **UPS Capacity** is marked mandatory in the supplied onboarding parameter matrix. This field captures nameplate rating. The unit shown in the parameter sheet is kVA/kW. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "UPS; UPS Capacity; onboarding; technical parameter; kVA/kW"
    ]
  },
  {
    id: "FAQ-260",
    category: "Asset Technical Parameters – UPS",
    question: "For UPS, what does the 'Input Voltage' onboarding field mean and how should I fill it?",
    answer: "For UPS, **Input Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures input rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "UPS; Input Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-261",
    category: "Asset Technical Parameters – UPS",
    question: "For UPS, what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For UPS, **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures output rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "UPS; Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-262",
    category: "Asset Technical Parameters – VCB (Vacuum Circuit Breaker)",
    question: "For VCB (Vacuum Circuit Breaker), what does the 'Rated Voltage' onboarding field mean and how should I fill it?",
    answer: "For VCB (Vacuum Circuit Breaker), **Rated Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures breaker rating. The unit shown in the parameter sheet is kV. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "VCB (Vacuum Circuit Breaker); Rated Voltage; onboarding; technical parameter; kV"
    ]
  },
  {
    id: "FAQ-263",
    category: "Asset Technical Parameters – VCB (Vacuum Circuit Breaker)",
    question: "For VCB (Vacuum Circuit Breaker), what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For VCB (Vacuum Circuit Breaker), **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures breaker rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "VCB (Vacuum Circuit Breaker); Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-264",
    category: "Asset Technical Parameters – VCB (Vacuum Circuit Breaker)",
    question: "For VCB (Vacuum Circuit Breaker), what does the 'Breaking Capacity' onboarding field mean and how should I fill it?",
    answer: "For VCB (Vacuum Circuit Breaker), **Breaking Capacity** is marked optional in the supplied onboarding parameter matrix. This field captures nameplate. The unit shown in the parameter sheet is kA. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "VCB (Vacuum Circuit Breaker); Breaking Capacity; onboarding; technical parameter; kA"
    ]
  },
  {
    id: "FAQ-265",
    category: "Asset Technical Parameters – VCB (Vacuum Circuit Breaker)",
    question: "For VCB (Vacuum Circuit Breaker), what does the 'Operating Mechanism' onboarding field mean and how should I fill it?",
    answer: "For VCB (Vacuum Circuit Breaker), **Operating Mechanism** is marked optional in the supplied onboarding parameter matrix. This field captures spring / motor charged etc.. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "VCB (Vacuum Circuit Breaker); Operating Mechanism; onboarding; technical parameter"
    ]
  },
  {
    id: "FAQ-266",
    category: "Asset Technical Parameters – VFD (Variable Frequency Drive)",
    question: "For VFD (Variable Frequency Drive), what does the 'Input Voltage' onboarding field mean and how should I fill it?",
    answer: "For VFD (Variable Frequency Drive), **Input Voltage** is marked mandatory in the supplied onboarding parameter matrix. This field captures drive input rating. The unit shown in the parameter sheet is V. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using text as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "VFD (Variable Frequency Drive); Input Voltage; onboarding; technical parameter; V"
    ]
  },
  {
    id: "FAQ-267",
    category: "Asset Technical Parameters – VFD (Variable Frequency Drive)",
    question: "For VFD (Variable Frequency Drive), what does the 'Rated Current' onboarding field mean and how should I fill it?",
    answer: "For VFD (Variable Frequency Drive), **Rated Current** is marked mandatory in the supplied onboarding parameter matrix. This field captures drive output rating. The unit shown in the parameter sheet is A. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "VFD (Variable Frequency Drive); Rated Current; onboarding; technical parameter; A"
    ]
  },
  {
    id: "FAQ-268",
    category: "Asset Technical Parameters – VFD (Variable Frequency Drive)",
    question: "For VFD (Variable Frequency Drive), what does the 'Motor Power Rating' onboarding field mean and how should I fill it?",
    answer: "For VFD (Variable Frequency Drive), **Motor Power Rating** is marked optional in the supplied onboarding parameter matrix. This field captures compatible/connected motor. The unit shown in the parameter sheet is kW. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "VFD (Variable Frequency Drive); Motor Power Rating; onboarding; technical parameter; kW"
    ]
  },
  {
    id: "FAQ-269",
    category: "Asset Technical Parameters – VFD (Variable Frequency Drive)",
    question: "For VFD (Variable Frequency Drive), what does the 'Drive Capacity' onboarding field mean and how should I fill it?",
    answer: "For VFD (Variable Frequency Drive), **Drive Capacity** is marked mandatory in the supplied onboarding parameter matrix. This field captures drive rating. The unit shown in the parameter sheet is kW/HP. Use the equipment nameplate, approved manufacturer documentation, or verified site record as the source; do not estimate or copy a value from another asset. Enter it using numeric as indicated by the form. If the value is unavailable and the field is mandatory, consult the responsible technical person rather than inventing a value.",
    keywords: [
      "VFD (Variable Frequency Drive); Drive Capacity; onboarding; technical parameter; kW/HP"
    ]
  },
  {
    id: "FAQ-270",
    category: "Asset Type Basics",
    question: "What is a ACB (Air Circuit Breaker), and what basic details should I capture?",
    answer: "An ACB is a low-voltage circuit breaker that uses air as the arc-extinguishing medium. The onboarding sheet captures ratings such as rated voltage/current, pole configuration, and optional breaking capacity. Use the nameplate and approved documentation for values. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "ACB (Air Circuit Breaker); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-271",
    category: "Asset Type Basics",
    question: "What is a MCCB, and what basic details should I capture?",
    answer: "An MCCB (Moulded Case Circuit Breaker) protects a circuit against specified overcurrent/fault conditions. Its relevant onboarding fields include voltage, rated current, trip rating, breaking capacity, and pole configuration. These are equipment ratings, not proof that the device is correctly selected for the installation. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "MCCB; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-272",
    category: "Asset Type Basics",
    question: "What is a VCB (Vacuum Circuit Breaker), and what basic details should I capture?",
    answer: "A VCB interrupts current using a vacuum interrupter and is commonly used in medium-voltage systems. Capture rated voltage/current, breaking capacity, and operating mechanism from the nameplate or verified records. Inspection and operation must follow approved procedures. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "VCB (Vacuum Circuit Breaker); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-273",
    category: "Asset Type Basics",
    question: "What is a SF6 Circuit Breaker, and what basic details should I capture?",
    answer: "An SF6 circuit breaker uses sulphur hexafluoride gas as an insulating/arc-interrupting medium in its designed construction. Record its nameplate ratings accurately. Gas handling, leakage response, and breaker maintenance require trained and authorized personnel. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "SF6 Circuit Breaker; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-274",
    category: "Asset Type Basics",
    question: "What is a HT Panel, and what basic details should I capture?",
    answer: "An HT panel is a high-voltage/medium-voltage switchgear assembly used for supply, switching, control, and protection. The onboarding fields include voltage/current ratings, incomer arrangement, and protection relay type. Confirm the equipment's actual rated voltage from its nameplate. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "HT Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-275",
    category: "Asset Type Basics",
    question: "What is a LT Panel, and what basic details should I capture?",
    answer: "An LT panel is a low-voltage distribution/control assembly. Its onboarding fields may include rated voltage/current, incomer type, and busbar material/rating. The inspection form may request phase currents, frequency, and earth-related readings where applicable. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "LT Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-276",
    category: "Asset Type Basics",
    question: "What is a MCC (Motor Control Center), and what basic details should I capture?",
    answer: "An MCC groups motor feeders and their control/protection devices. Its onboarding details include rated voltage/current, busbar rating, feeder count, and motor-starter technology. The installed starter arrangement should be confirmed from labels or records. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "MCC (Motor Control Center); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-277",
    category: "Asset Type Basics",
    question: "What is a PCC (Power Control Center), and what basic details should I capture?",
    answer: "A PCC is a power distribution/control assembly for distributing electrical power to downstream loads or panels. Capture its rated voltage/current and short-circuit rating from approved documentation. Engineering verification is needed to assess system suitability. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "PCC (Power Control Center); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-278",
    category: "Asset Type Basics",
    question: "What is a APFC Panel, and what basic details should I capture?",
    answer: "An APFC panel automatically switches capacitor stages to help control power factor. Its onboarding sheet records total APFC capacity in kVAr and controller make/model. Total capacity is not the same as a live power-factor reading. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "APFC Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-279",
    category: "Asset Type Basics",
    question: "What is a AMF Panel, and what basic details should I capture?",
    answer: "An AMF (Automatic Mains Failure) panel monitors mains availability and manages the configured changeover/start sequence with a generator system. Record the panel rating, connected generator rating, and controller details from verified records. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "AMF Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-280",
    category: "Asset Type Basics",
    question: "What is a Distribution Transformer, and what basic details should I capture?",
    answer: "A distribution transformer transfers electrical energy between voltage levels for distribution. Its onboarding fields include rated power, HV/LV voltage, phase, impedance, cooling type, and vector group. Capture the exact nameplate designations. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Distribution Transformer; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-281",
    category: "Asset Type Basics",
    question: "What is a Power Transformer, and what basic details should I capture?",
    answer: "A power transformer transfers electrical energy between voltage levels in a power system. Record rated power, HV/LV voltage, phase, vector group, cooling type, impedance, and tap-changer type as applicable from its nameplate or approved documents. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Power Transformer; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-282",
    category: "Asset Type Basics",
    question: "What is a Instrument Transformer (CT/PT), and what basic details should I capture?",
    answer: "Instrument transformers scale current or voltage for measurement and protection. Record instrument type, primary/secondary ratings, accuracy class, and core/ratio details exactly. Their circuits can present specific hazards; only trained personnel should test or handle them. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Instrument Transformer (CT/PT); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-283",
    category: "Asset Type Basics",
    question: "What is a Battery Bank, and what basic details should I capture?",
    answer: "A battery bank is an interconnected set of batteries/cells used to provide stored DC energy. The onboarding form captures nominal bank voltage, number of batteries/cells, and unit Ah capacity. Inspection values must be recorded with the correct measurement point and unit. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Battery Bank; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-284",
    category: "Asset Type Basics",
    question: "What is a Battery Charger, and what basic details should I capture?",
    answer: "A battery charger converts its input supply into a suitable charging output for a battery system. The onboarding sheet records charger capacity, input voltage, output voltage, and battery-bank voltage. Use nameplate ratings, not instantaneous readings, for rated fields. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Battery Charger; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-285",
    category: "Asset Type Basics",
    question: "What is a UPS, and what basic details should I capture?",
    answer: "A UPS (Uninterruptible Power Supply) provides conditioned/backup power to connected loads. Its onboarding fields include capacity, input voltage, and rated current. Capacity may be stated in kVA and/or kW, so preserve the nameplate units. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "UPS; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-286",
    category: "Asset Type Basics",
    question: "What is a VFD (Variable Frequency Drive), and what basic details should I capture?",
    answer: "A VFD controls an AC motor by varying the frequency and voltage supplied to it. The onboarding sheet records input voltage, rated current, motor power rating, and drive capacity. Drive capacity and motor rating are separate fields. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "VFD (Variable Frequency Drive); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-287",
    category: "Asset Type Basics",
    question: "What is a Soft Starter Panel, and what basic details should I capture?",
    answer: "A soft starter reduces motor starting stress by controlling the applied voltage/current during startup according to its design. Record rated voltage, motor power rating, and rated current from the equipment documentation. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Soft Starter Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-288",
    category: "Asset Type Basics",
    question: "What is a Solar Inverter, and what basic details should I capture?",
    answer: "A solar inverter converts DC power from the PV array into AC power. The parameter sheet separates rated AC power, maximum DC input power, and grid voltage. Do not substitute DC ratings for AC ratings. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Solar Inverter; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-289",
    category: "Asset Type Basics",
    question: "What is a Solar Combiner Box, and what basic details should I capture?",
    answer: "A solar combiner box combines inputs from multiple PV strings and may include protective/isolation components depending on its design. Record its voltage/current ratings from the nameplate. PV DC circuits can remain hazardous in daylight and must be handled under approved procedures. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Solar Combiner Box; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-290",
    category: "Asset Type Basics",
    question: "What is a Busbar, and what basic details should I capture?",
    answer: "A busbar is a conductive bar or system used to distribute electrical power within switchgear or panels. The onboarding fields include rating, voltage, material, and type. Record material and configuration from documentation or verified labels. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Busbar; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-291",
    category: "Asset Type Basics",
    question: "What is a Distribution Board (DB), and what basic details should I capture?",
    answer: "A distribution board distributes incoming power to outgoing circuits. Its onboarding fields include rated voltage, incomer rating, and enclosure IP rating. The number and type of outgoing circuits should follow the approved record where captured. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Distribution Board (DB); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-292",
    category: "Asset Type Basics",
    question: "What is a Sub Distribution Board (SDB), and what basic details should I capture?",
    answer: "An SDB distributes power downstream from an upstream panel or DB. Record its rated voltage and incomer rating from verified documentation and ensure its location/hierarchy links it to the correct upstream site structure. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Sub Distribution Board (SDB); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-293",
    category: "Asset Type Basics",
    question: "What is a Lighting Distribution Board (LDB), and what basic details should I capture?",
    answer: "An LDB supplies lighting circuits. Its onboarding fields include rated voltage, incomer rating, and outgoing-way count. Count outgoing ways according to the approved data definition, not just the number of occupied breakers. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Lighting Distribution Board (LDB); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-294",
    category: "Asset Type Basics",
    question: "What is a PLC Panel, and what basic details should I capture?",
    answer: "A PLC panel houses a programmable logic controller and associated power/control components. Record the PLC make/model and supply voltage from labels or documentation. Do not alter logic or controller settings as part of routine asset data capture. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "PLC Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-295",
    category: "Asset Type Basics",
    question: "What is a Control Panel, and what basic details should I capture?",
    answer: "A control panel houses control devices and circuits for a machine or process. The onboarding form includes control voltage, rated current, and whether a PLC/controller is present. Verify these from labels or approved drawings. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Control Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-296",
    category: "Asset Type Basics",
    question: "What is a Relay Panel, and what basic details should I capture?",
    answer: "A relay panel contains protective/control relays and associated circuits. Capture system voltage and relay make/model. Protection settings and coordination are engineering-controlled information and should not be changed during routine inspection. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Relay Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-297",
    category: "Asset Type Basics",
    question: "What is a Fire Alarm Panel, and what basic details should I capture?",
    answer: "A fire alarm panel receives and processes signals from connected fire detection/alarm devices. The form records panel type and connected-device count. Any testing, isolation, or reset must follow the authorized fire-safety procedure. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Fire Alarm Panel; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-298",
    category: "Asset Type Basics",
    question: "What is a Network Switch, and what basic details should I capture?",
    answer: "A network switch connects devices within a data or industrial network. The onboarding form captures switch type and power supply. Network configuration and cybersecurity settings should be handled by authorized IT/OT personnel. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Network Switch; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-299",
    category: "Asset Type Basics",
    question: "What is a Industrial Network Equipment, and what basic details should I capture?",
    answer: "This category covers industrial communications equipment such as routers, firewalls, media converters, or gateways. Capture equipment type, supply voltage, and communication interface from labels or approved network documentation. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Industrial Network Equipment; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-300",
    category: "Asset Type Basics",
    question: "What is a RTU (Remote Terminal Unit), and what basic details should I capture?",
    answer: "An RTU collects field signals and communicates status/telemetry to a supervisory system. The onboarding sheet records its supply voltage. Communications configuration and control actions should be handled by authorized controls/OT personnel. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "RTU (Remote Terminal Unit); asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-301",
    category: "Asset Type Basics",
    question: "What is a Inverter, and what basic details should I capture?",
    answer: "An inverter converts DC electrical power to AC or changes electrical power characteristics according to its design. Record rated power and voltage from its nameplate, and use the more specific Solar Inverter category when that matches the installed equipment. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Inverter; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-302",
    category: "Asset Type Basics",
    question: "What is a Other, and what basic details should I capture?",
    answer: "Use the Other category only when the installed asset does not match a listed category. Enter a clear equipment description and verified ratings, attach an overall photo, and request category review if the type is expected to recur. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "Other; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-303",
    category: "Asset Type Basics",
    question: "What is a SCADA System, and what basic details should I capture?",
    answer: "A SCADA system supervises and monitors industrial processes using controllers, communications, and operator interfaces. The inspection parameter sheet includes voltage and selected earth-related readings; use the approved checklist and authorized electrical measurement procedure. Always verify asset identity and ratings against the nameplate or approved documentation. Do not use a general definition to replace asset-specific instructions.",
    keywords: [
      "SCADA System; asset type; definition; onboarding; inspection"
    ]
  },
  {
    id: "FAQ-304",
    category: "Inspection Measurement Fields",
    question: "What does the 'Voltage' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Voltage' as mandatory with data type 'Number'. Enter the actual voltage measurement in volts (V) at the approved measurement point. Do not copy a nameplate rated voltage into a measured-value field. Unit: V. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Voltage; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-305",
    category: "Inspection Measurement Fields",
    question: "What does the 'Load Current per phase (R, Y, B)' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Load Current per phase (R, Y, B)' as mandatory with data type 'Number for R,Y,B'. Enter the separate measured current for the R, Y, and B phases in amperes (A), as required by the asset-specific form. Unit: A. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Load Current per phase (R",
      "Y",
      "B); inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-306",
    category: "Inspection Measurement Fields",
    question: "What does the 'Frequency' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Frequency' as mandatory with data type 'Number'. Enter the actual AC frequency measurement in hertz (Hz) where the selected asset checklist includes this field. Unit: Hz. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Frequency; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-307",
    category: "Inspection Measurement Fields",
    question: "What does the 'Neutral Earth Voltage' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Neutral Earth Voltage' as optional with data type 'Number'. Enter the measured voltage between neutral and the earth reference in volts (V), using the approved procedure. An abnormal reading needs competent technical assessment. Unit: V. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Neutral Earth Voltage; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-308",
    category: "Inspection Measurement Fields",
    question: "What does the 'Body Earth Volatge' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Body Earth Volatge' as optional with data type 'Number'. Enter the measured voltage between the equipment body/enclosure and the earth reference in volts (V), using the approved procedure. Do not touch equipment to perform this check; escalate unexpected results. Unit: V. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Body Earth Volatge; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-309",
    category: "Inspection Measurement Fields",
    question: "What does the 'Load Current' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Load Current' as mandatory with data type 'Number'. Enter the actual measured load current in amperes (A) for the point/circuit specified by the checklist. Unit: A. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Load Current; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-310",
    category: "Inspection Measurement Fields",
    question: "What does the 'Neutral current' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Neutral current' as optional with data type 'Number'. Enter the measured current in the neutral conductor in amperes (A) where the selected asset checklist includes this field. Unit: A. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Neutral current; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-311",
    category: "Inspection Measurement Fields",
    question: "What does the 'Load Current' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Load Current' as mandatory with data type 'Number'. Enter the actual measured load current in amperes (A) for the point/circuit specified by the checklist. Unit: A. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Load Current; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-312",
    category: "Inspection Measurement Fields",
    question: "What does the 'Load Current per phase (R, Y, B)' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Load Current per phase (R, Y, B)' as optional with data type 'Number for R,Y,B'. Enter the separate measured current for the R, Y, and B phases in amperes (A), as required by the asset-specific form. Unit: A. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Load Current per phase (R",
      "Y",
      "B); inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-313",
    category: "Inspection Measurement Fields",
    question: "What does the 'Frequency' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Frequency' as optional with data type 'Number'. Enter the actual AC frequency measurement in hertz (Hz) where the selected asset checklist includes this field. Unit: Hz. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Frequency; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-314",
    category: "Inspection Measurement Fields",
    question: "What does the 'Load Current' inspection field mean, and how should I record it?",
    answer: "The parameter matrix marks 'Load Current' as optional with data type 'Number'. Enter the actual measured load current in amperes (A) for the point/circuit specified by the checklist. Unit: A. Record the real measurement accurately; never guess, substitute a nominal value, or alter a result to make it appear normal. If the measurement cannot be taken or appears abnormal, follow the approved incomplete-measurement and escalation procedures.",
    keywords: [
      "Load Current; inspection; measurement; EVITA"
    ]
  },
  {
    id: "FAQ-315",
    category: "Asset-Family Inspection Guidance",
    question: "What basic inspection parameters should I expect for panels and switchboards?",
    answer: "For panels and switchboards such as HT/LT panels, DB, SDB, LDB, MCC, PCC, APFC, AMF, control and PLC panels, the inspection matrix may request voltage, phase-wise load current, frequency, neutral current, and/or earth-related readings. Only complete fields shown for that asset. Use approved measurement points and safety procedures. EVITA's asset-specific checklist and approved parameter matrix are the source of truth; do not assume every parameter applies to every model.",
    keywords: [
      "Panels and switchboards; inspection parameters; measurement; asset family"
    ]
  },
  {
    id: "FAQ-316",
    category: "Asset-Family Inspection Guidance",
    question: "What basic inspection parameters should I expect for circuit breakers?",
    answer: "For ACB, MCCB, VCB and SF6 circuit breakers, the basic inspection fields in the supplied matrix include voltage, load current and frequency, with neutral/earth-related fields where configured. These values do not replace functional, protection, contact-resistance, timing, or other specialist tests that may be required by an approved maintenance procedure. EVITA's asset-specific checklist and approved parameter matrix are the source of truth; do not assume every parameter applies to every model.",
    keywords: [
      "Circuit breakers; inspection parameters; measurement; asset family"
    ]
  },
  {
    id: "FAQ-317",
    category: "Asset-Family Inspection Guidance",
    question: "What basic inspection parameters should I expect for transformers?",
    answer: "For power and distribution transformers, the supplied inspection matrix includes voltage, phase-wise load current, frequency, neutral current and selected earth-related readings. The exact fields depend on the asset record. Oil tests, winding tests, temperature limits, vector group verification and other specialist checks must follow the approved maintenance plan. EVITA's asset-specific checklist and approved parameter matrix are the source of truth; do not assume every parameter applies to every model.",
    keywords: [
      "Transformers; inspection parameters; measurement; asset family"
    ]
  },
  {
    id: "FAQ-318",
    category: "Asset-Family Inspection Guidance",
    question: "What basic inspection parameters should I expect for battery systems?",
    answer: "For a battery bank, the supplied inspection fields include voltage and load current. Confirm the field's measurement point and whether the value refers to the complete bank or an individual unit. Battery chemistry-specific limits and testing procedures must come from the manufacturer and approved maintenance procedure. EVITA's asset-specific checklist and approved parameter matrix are the source of truth; do not assume every parameter applies to every model.",
    keywords: [
      "Battery systems; inspection parameters; measurement; asset family"
    ]
  },
  {
    id: "FAQ-319",
    category: "Asset-Family Inspection Guidance",
    question: "What basic inspection parameters should I expect for ups and inverters?",
    answer: "For UPS and inverter assets, the supplied matrix includes voltage, load current and frequency where configured, plus selected earth-related readings. Input, output, AC, and DC readings are not interchangeable; record only the quantity indicated by the form. EVITA's asset-specific checklist and approved parameter matrix are the source of truth; do not assume every parameter applies to every model.",
    keywords: [
      "UPS and inverters; inspection parameters; measurement; asset family"
    ]
  },
  {
    id: "FAQ-320",
    category: "Asset-Family Inspection Guidance",
    question: "What basic inspection parameters should I expect for solar equipment?",
    answer: "For solar inverters and combiner boxes, follow the specific field labels and approved PV safety procedures. PV DC circuits may remain energized in daylight. Do not open enclosures or measure live DC circuits unless specifically trained, authorized, and equipped under the approved procedure. EVITA's asset-specific checklist and approved parameter matrix are the source of truth; do not assume every parameter applies to every model.",
    keywords: [
      "Solar equipment; inspection parameters; measurement; asset family"
    ]
  },
  {
    id: "FAQ-321",
    category: "Asset-Family Inspection Guidance",
    question: "What basic inspection parameters should I expect for fire alarm and network/control equipment?",
    answer: "For fire alarm panels, network switches, industrial network equipment, RTUs, SCADA, and relay/control systems, the supplied inspection matrix includes basic supply-voltage and selected earth-related fields. Configuration, fire-system isolation, protection settings, and OT/network changes require authorized specialist personnel. EVITA's asset-specific checklist and approved parameter matrix are the source of truth; do not assume every parameter applies to every model.",
    keywords: [
      "Fire alarm and network/control equipment; inspection parameters; measurement; asset family"
    ]
  }
]
