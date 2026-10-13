import { faqEntries, searchFaq, type FaqEntry } from "@/data/faq"

/**
 * What the help bubble answers with.
 *
 * There is no model behind it and there is not meant to be one yet: every
 * answer it gives is a row of the client's own `Olivine_APP_AI_Chatbot_FAQ_`
 * sheet, verbatim, matched to what was typed. The sheet was written for a
 * chatbot - see the header of data/faq.ts - so the Phase-2 assistant should
 * replace the matching here and keep the same rows.
 *
 * Matching is deterministic: the same question always returns the same answer,
 * so a demo can be rehearsed and a wrong answer can be reproduced.
 *
 * TODO(olivine): swap `askBot` for the real assistant endpoint when it exists.
 * The FAQ stays as the offline fallback - the tablet is used in plant rooms
 * with no signal, which is where the help is needed most.
 */

const entryById = new Map(faqEntries.map((entry) => [entry.id, entry]))

/**
 * The questions offered before anything is typed: the "how do I ..." rows, one
 * per thing an ELPREMAR actually does on a shift - onboard, inspect,
 * photograph, sync, escalate - so the bubble opens on a process and not on a
 * parameter definition.
 */
export const botStarters: FaqEntry[] = (() => {
  const wanted = ["FAQ-017", "FAQ-028", "FAQ-032", "FAQ-037", "FAQ-064"]
  const found = wanted.map((id) => entryById.get(id)).filter((entry): entry is FaqEntry => Boolean(entry))
  /* The sheet is regenerated from an export; if an id goes, still offer something */
  return found.length ? found : faqEntries.slice(0, 5)
})()

/**
 * Words that say nothing about which answer is wanted. "How" and "what" are
 * here too: nearly every row's question opens with one, so scoring on them
 * would rank the whole sheet alike.
 */
const stopWords = new Set([
  "the", "and", "for", "are", "was", "with", "this", "that", "from", "have", "has", "can", "could", "should",
  "would", "does", "did", "how", "what", "when", "where", "which", "why", "who", "whom", "you", "your",
  "yours", "any", "all", "its", "but", "not", "into", "out", "about", "there", "here", "than", "then",
  "them", "they", "will", "need", "want", "please", "tell", "show", "help", "evita", "app",
  /* Generic verbs: the sheet reads "take a measurement", "make an entry" everywhere */
  "take", "make", "put", "get", "got",
])

const wordsOf = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g) ?? []

/**
 * Where a word sits in a row decides how much finding it counts for: the
 * question is what someone is echoing back, the sheet's own alternate
 * phrasings are the next best signal, and the body of an answer mentions a
 * word in passing often enough that a hit there barely counts at all.
 */
const fields = [
  { weight: 6, of: (entry: FaqEntry) => entry.question },
  { weight: 5, of: (entry: FaqEntry) => entry.keywords.join(" ") },
  { weight: 3, of: (entry: FaqEntry) => entry.category },
  { weight: 1, of: (entry: FaqEntry) => entry.answer },
] as const

/** At or above this weight the row is about the word, rather than mentioning it */
const aboutIt = 3

/** Each row's words, split by field, worked out once at load and not per keystroke */
const index = faqEntries.map((entry) => ({
  entry,
  parts: fields.map((field) => ({ weight: field.weight, words: new Set(wordsOf(field.of(entry))) })),
}))

/**
 * How far a word narrows the sheet down. "Inspection" is in most of the rows
 * and separates nothing; "thermography" picks out a handful. Without this a
 * generic verb in the question - "take", "enter", "record" - outranks the one
 * word that actually said what was being asked about.
 */
const docFreq = new Map<string, number>()
for (const row of index) {
  for (const word of new Set(row.parts.flatMap(({ words }) => [...words]))) {
    docFreq.set(word, (docFreq.get(word) ?? 0) + 1)
  }
}

function narrowness(word: string) {
  const seen = docFreq.get(word) ?? 0
  /* A word the sheet never uses can only have matched by stem, which is signal enough */
  if (!seen) return 1
  return Math.log(index.length / seen) / Math.log(index.length)
}

/**
 * Whether a field uses a word, and how squarely.
 *
 * The same thing gets typed in forms the sheet does not use - "photos" for
 * "photographs", "syncing" for "synchronize" - so words of five letters or
 * more also match on their first five, which is enough of a stem for the
 * vocabulary here. It is a near miss rather than a hit, so it scores below one.
 */
function uses(words: Set<string>, term: string) {
  if (words.has(term)) return 1
  if (term.length < 5) return 0
  const stem = term.slice(0, 5)
  for (const word of words) {
    if (word.length >= 5 && word.slice(0, 5) === stem) return 0.85
  }
  return 0
}

type Scored = { entry: FaqEntry; score: number; about: boolean }

/**
 * One row against one question. A row that answers most of what was asked has
 * to beat one that happens to repeat a single word, so the share of the
 * question it covers is worth something on its own.
 */
function scoreOf(row: (typeof index)[number], terms: string[]): Scored {
  let score = 0
  let hits = 0
  let about = false

  for (const term of terms) {
    let best = 0
    for (const { weight, words } of row.parts) {
      const found = uses(words, term)
      if (!found) continue
      best = Math.max(best, weight * found)
      if (weight >= aboutIt) about = true
    }
    if (best) hits += 1
    score += best * narrowness(term)
  }

  return { entry: row.entry, score: hits ? score + (4 * hits) / terms.length : 0, about }
}

/** Below this, or with nothing but an answer body matching, a row is a coincidence */
const confident = 5

/**
 * Greetings and sign-offs, which are not questions and have no row to return.
 * Matched against the whole message, so "hello how do I sync" is still read as
 * the question it is.
 */
const smallTalk: { match: RegExp; reply: string }[] = [
  {
    match: /^(hi|hey|hello|yo|namaste|good (morning|afternoon|evening))( there| evita)?[\s!.]*$/,
    reply:
      "Hello. Ask me how something is done in EVITA - onboarding an asset, running an inspection, syncing once you have signal again - and I will read you the approved answer.",
  },
  {
    match: /^(thanks|thank you|thankyou|thx|ty|ok|okay|great|cool|got it)( very much| a lot)?[\s!.]*$/,
    reply: "Glad that helped. Ask another question whenever you need it.",
  },
  {
    match: /^(bye|goodbye|see you|that's all|thats all)[\s!.]*$/,
    reply: "Stay safe out there. The bubble is on every screen if you need it again.",
  },
  {
    match: /^(who are you|what are you|what can you do|are you (a )?(bot|human|real))[\s!?.]*$/,
    reply:
      "I am EVITA's help assistant. I read back OLIVINE's approved FAQ, nothing more - I do not judge an asset's condition and I do not change any record. For anything that needs tracking, raise a ticket.",
  },
]

export type BotReply =
  /** A row of the sheet, with the next-best rows offered as follow-ups */
  | { kind: "answer"; entry: FaqEntry; related: FaqEntry[] }
  /** Not a question: a greeting or a sign-off */
  | { kind: "reply"; text: string }
  /** Nothing in the sheet is close enough; the nearest rows are offered instead */
  | { kind: "unknown"; related: FaqEntry[] }

/** The one entry point: what was typed in, one reply out */
export function askBot(query: string): BotReply {
  const asked = query.trim()
  if (!asked) return { kind: "unknown", related: botStarters.slice(0, 3) }

  const lower = asked.toLowerCase()
  const talk = smallTalk.find(({ match }) => match.test(lower))
  if (talk) return { kind: "reply", text: talk.reply }

  /* Tapping a suggested question sends its exact wording; never make that one guess */
  const exact = faqEntries.find((entry) => entry.question.toLowerCase() === lower)
  if (exact) return { kind: "answer", entry: exact, related: sameCategoryAs(exact) }

  const all = wordsOf(asked)
  const significant = all.filter((word) => word.length > 2 && !stopWords.has(word))
  /* "PD?" or "QR" can be the whole question - fall back to what was actually typed */
  const terms = significant.length ? significant : all
  if (!terms.length) return { kind: "unknown", related: botStarters.slice(0, 3) }

  /*
   * searchFaq wants every word present, so when it matches at all the row is a
   * strong candidate. Used as a boost rather than a filter: an engineer types a
   * word the sheet does not use and would otherwise get nothing back. A single
   * word on its own matches far too much for the boost to mean anything.
   */
  const strict =
    terms.length > 1 ? new Set(searchFaq(faqEntries, terms.join(" ")).map((entry) => entry.id)) : new Set<string>()

  const ranked = index
    .map((row) => scoreOf(row, terms))
    .map((scored) => (strict.has(scored.entry.id) ? { ...scored, score: scored.score + 6, about: true } : scored))
    .filter(({ score }) => score > 0)
    /* Sorted by id behind the score, so equally good rows always come back in the same order */
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))

  const best = ranked[0]
  if (!best || best.score < confident || !best.about) {
    return { kind: "unknown", related: ranked.slice(0, 3).map(({ entry }) => entry) }
  }
  return { kind: "answer", entry: best.entry, related: ranked.slice(1, 4).map(({ entry }) => entry) }
}

/** Follow-ups for a row asked for by name: the rest of its category, in sheet order */
function sameCategoryAs(entry: FaqEntry): FaqEntry[] {
  return faqEntries.filter((other) => other.category === entry.category && other.id !== entry.id).slice(0, 3)
}
