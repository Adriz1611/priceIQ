// Product identity matching engine.
// Converts a search query into structured intent (brand, model tokens, storage, variant)
// and scores retailer candidate titles against that intent.
// Hard-reject rules catch accessories, wrong variants, and storage mismatches before any
// soft score is computed; only candidates that survive all hard rejects and score >= threshold
// are written to the database.

export const KNOWN_BRANDS = [
  "apple", "samsung", "oneplus", "xiaomi", "redmi", "realme",
  "google", "sony", "boat", "jbl", "dell", "hp", "lenovo",
  "asus", "acer", "lg", "motorola", "nothing", "iqoo", "vivo",
  "bose", "sennheiser", "noise", "fastrack", "titan",
];

// Ordered longest-first so "pro max" is tested before "pro", etc.
const VARIANTS = [
  "pro max", "pro plus", "ultra max", "ultra pro",
  "ultra", "pro", "plus", "max", "lite", "mini", "fe", "air", "note", "neo",
];

const ACCESSORY_WORDS = [
  "case", "cover", "charger", "cable", "screen guard", "tempered glass",
  "protector", "pouch", "skin", "stand", "dock", "hub", "adapter",
  "grip", "bumper", "wallet", "holster", "sleeve", "strap",
];

const REJECT_PHRASES = ["renewed", "refurbished", "open box", "pre-owned"];

// Canonical text form used for all comparisons.
// "+" → " plus " so "S24+" normalises to "s24 plus" before tokenising.
// Letter-digit model codes (WH-1000XM5) are joined before the general dash→space
// rule so the full code stays as one token ("wh1000xm5"), preventing WF-1000XM5
// earbuds from matching a WH-1000XM5 headphone query via the shared "1000xm5" suffix.
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/([a-z]+)-(\d[a-z0-9]*)/g, "$1$2")
    .replace(/[-–_/]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Detect the highest-priority variant present in an already-normalised string.
// Returns undefined when no known variant word is found.
// Display resolution terms ("ultra hd", "full hd", "qhd") are stripped first so
// "4K Ultra HD" in a TV title doesn't trigger the "ultra" variant path.
function detectVariant(normalised: string): string | undefined {
  const cleaned = normalised
    .replace(/\bultra\s+hd\b/g, "")
    .replace(/\bfull\s+hd\b/g, "")
    .replace(/\bqhd\b/g, "");
  return VARIANTS.find((v) =>
    new RegExp(`\\b${v.replace(" ", "\\s+")}\\b`).test(cleaned)
  );
}

export interface ParsedQuery {
  raw: string;
  normalized: string;
  brand?: string;
  /** Alphanumeric tokens that contain at least one digit and are not storage tokens. */
  modelTokens: string[];
  /** e.g. "128gb", "256gb", "1tb" */
  storageToken?: string;
  /** e.g. "ultra", "pro max", "plus" */
  variantToken?: string;
  /** True when the query itself contains "renewed" etc. so we don't reject renewed listings. */
  hasRejectPhrase: boolean;
  category: string;
  minPrice: number;
}

export function parseQuery(raw: string, category: string, minPrice: number): ParsedQuery {
  const normalized = normalizeText(raw);

  const brand = KNOWN_BRANDS.find((b) => normalized.includes(b));

  // First storage-like token wins (e.g. "128gb" from "iphone 15 128gb")
  const storageToken = normalized.match(/\b(\d+(?:gb|tb))\b/)?.[1];

  const variantToken = detectVariant(normalized);

  // Model tokens: any word with at least one digit, excluding storage ("128gb")
  const modelTokens = normalized.split(" ").filter((w) => {
    if (w.length < 2) return false;
    if (!/\d/.test(w)) return false;
    if (/^\d+(?:gb|tb)$/.test(w)) return false;
    return true;
  });

  const hasRejectPhrase = REJECT_PHRASES.some((p) => normalized.includes(p));

  return { raw, normalized, brand, modelTokens, storageToken, variantToken, hasRejectPhrase, category, minPrice };
}

export interface MatchResult {
  score: number;
  accepted: boolean;
  reasons: string[];
}

export function scoreCandidate(candidateTitle: string, query: ParsedQuery): MatchResult {
  const cn = normalizeText(candidateTitle);
  const reasons: string[] = [];
  let score = 0;

  // ── Hard rejects ────────────────────────────────────────────────────────────

  if (ACCESSORY_WORDS.some((w) => cn.includes(w))) {
    return { score: -100, accepted: false, reasons: ["accessory keyword"] };
  }

  if (!query.hasRejectPhrase && REJECT_PHRASES.some((p) => cn.includes(p))) {
    return { score: -80, accepted: false, reasons: ["renewed/refurbished not requested"] };
  }

  // ── Soft penalties ───────────────────────────────────────────────────────────

  if (/(combo|bundle|kit|pack)\b/.test(cn) && !/(combo|bundle|kit|pack)\b/.test(query.normalized)) {
    score -= 30;
    reasons.push("combo/bundle");
  }

  // ── Brand (+30 / -30) ────────────────────────────────────────────────────────

  if (query.brand) {
    if (cn.includes(query.brand)) {
      score += 30;
      reasons.push("brand ✓");
    } else {
      score -= 30;
      reasons.push(`brand "${query.brand}" missing`);
    }
  }

  // ── Model tokens (+40 proportional, hard-reject on 0 matches) ───────────────

  if (query.modelTokens.length > 0) {
    // Word-boundary match prevents "12" matching "12r" or "128gb"
    const matched = query.modelTokens.filter((t) =>
      new RegExp(`\\b${t}\\b`).test(cn)
    );
    if (matched.length === 0) {
      return {
        score: -50,
        accepted: false,
        reasons: [`no model tokens matched (need: ${query.modelTokens.join(", ")})`],
      };
    }
    score += Math.round(40 * (matched.length / query.modelTokens.length));
    reasons.push(`tokens ${matched.length}/${query.modelTokens.length}`);
  }

  // ── Storage (+20, hard-reject on conflict) ───────────────────────────────────

  if (query.storageToken) {
    const titleStorage = [...cn.matchAll(/\b(\d+(?:gb|tb))\b/g)].map((m) => m[1]);
    if (titleStorage.includes(query.storageToken)) {
      score += 20;
      reasons.push("storage ✓");
    } else if (titleStorage.length > 0) {
      // Candidate lists a different storage size — definitely the wrong variant
      return {
        score: -60,
        accepted: false,
        reasons: [`storage conflict: want ${query.storageToken}, candidate has ${titleStorage.join("/")}`],
      };
    } else {
      // Candidate title has no storage info — penalise but don't reject
      // (some retailer titles omit storage even for the correct SKU)
      score -= 5;
      reasons.push("no storage in title");
    }
  }

  // ── Variant (+20, hard-reject on conflicting variant) ───────────────────────
  // detectVariant on the candidate uses the same longest-first priority so
  // "pro max" is never confused with standalone "pro".

  const candidateVariant = detectVariant(cn);

  if (query.variantToken) {
    if (candidateVariant === query.variantToken) {
      score += 20;
      reasons.push("variant ✓");
    } else if (candidateVariant !== undefined) {
      // e.g. query wants "ultra" but candidate is "plus" — wrong product
      return {
        score: -60,
        accepted: false,
        reasons: [`variant conflict: want "${query.variantToken}", candidate has "${candidateVariant}"`],
      };
    } else {
      // Variant required but not found in title — large penalty but not hard-reject
      // (some retailer titles abbreviate the variant name)
      score -= 25;
      reasons.push(`variant "${query.variantToken}" not found in title`);
    }
  } else if (candidateVariant) {
    // Query has no variant but candidate does — probably a different model tier
    score -= 15;
    reasons.push(`unexpected variant "${candidateVariant}" in candidate`);
  }

  // ── Accept/reject threshold ──────────────────────────────────────────────────
  // Lower threshold when query has no model tokens (vague query like "Sony headphones")
  const minScore = query.modelTokens.length > 0 ? 40 : 20;
  return { score, accepted: score >= minScore, reasons };
}
