export const RECORD_TYPES = [
  "RoR",
  "Patta",
  "Chitta",
  "A-Register",
  "FMB",
  "Cadastral Map",
  "Mutation Document",
  "Sale Deed",
  "Registration Document",
  "Tax Record",
  "Subdivision Record",
  "Old Settlement Register",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export type ClassificationDecision = "pending" | "accepted" | "manual_review";

export type TypeScore = {
  type: RecordType;
  confidence: number;
};

export type ClassificationResult = {
  predictedType: RecordType;
  confidence: number;
  alternatives: TypeScore[];
  language: string;
  decision: ClassificationDecision;
};

const TYPE_RULES: { type: RecordType; patterns: RegExp[] }[] = [
  { type: "A-Register", patterns: [/a[-_\s]?register/i, /aregister/i] },
  {
    type: "Old Settlement Register",
    patterns: [/settlement/i, /jamabandi/i],
  },
  {
    type: "Sale Deed",
    patterns: [/sale[-_\s]?deed/i, /saledeed/i, /conveyance/i],
  },
  {
    type: "Registration Document",
    patterns: [/registration/i, /encumbrance/i, /\bec\b/i],
  },
  {
    type: "Mutation Document",
    patterns: [/mutation/i, /khata/i],
  },
  { type: "Tax Record", patterns: [/tax/i, /challan/i] },
  {
    type: "FMB",
    patterns: [/fmb/i, /field[-_\s]?measurement/i],
  },
  {
    type: "Cadastral Map",
    patterns: [/cadastral/i, /village[-_\s]?map/i],
  },
  {
    type: "Subdivision Record",
    patterns: [/sub[-_\s]?div/i, /subdivision/i],
  },
  {
    type: "RoR",
    patterns: [/\bror\b/i, /record[-_\s]?of[-_\s]?right/i, /adangal/i],
  },
  { type: "Patta", patterns: [/patta/i] },
  { type: "Chitta", patterns: [/chitta/i] },
];

const LANGUAGES = [
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Hindi",
  "English",
  "Tamil / English",
  "Hindi / English",
] as const;

function hashName(name: string): number {
  return Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function inferType(name: string): { type: RecordType; matched: boolean } {
  for (const rule of TYPE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(name))) {
      return { type: rule.type, matched: true };
    }
  }
  return {
    type: RECORD_TYPES[hashName(name) % RECORD_TYPES.length],
    matched: false,
  };
}

function inferLanguage(name: string): string {
  const lower = name.toLowerCase();
  if (
    /sirkazhi|thanjavur|madurai|chennai|coimbatore|tamil|tn[-_]/i.test(lower)
  ) {
    return "Tamil / English";
  }
  if (/hyderabad|andhra|telangana|telugu/i.test(lower)) return "Telugu";
  if (/bengaluru|mysore|karnataka|kannada/i.test(lower)) return "Kannada";
  if (/kerala|malayalam/i.test(lower)) return "Malayalam";
  return LANGUAGES[hashName(name) % LANGUAGES.length];
}

function roundConfidence(value: number): number {
  return Math.round(value * 10) / 10;
}

export function mockClassify(name: string): ClassificationResult {
  const { type, matched } = inferType(name);
  const hash = hashName(name);
  const base = matched ? 82 + (hash % 15) : 56 + (hash % 18);
  const confidence = roundConfidence(Math.min(base + (hash % 7) / 10, 97.4));

  const others = RECORD_TYPES.filter((item) => item !== type);
  const start = hash % others.length;
  const alternatives: TypeScore[] = [0, 1, 2].map((offset, index) => {
    const alt = others[(start + offset) % others.length];
    const drop = 12 + index * 9 + (hash % 5);
    return {
      type: alt,
      confidence: roundConfidence(Math.max(confidence - drop, 8)),
    };
  });

  return {
    predictedType: type,
    confidence,
    alternatives,
    language: inferLanguage(name),
    decision: "pending",
  };
}

export function isClassificationLocked(result?: ClassificationResult): boolean {
  return Boolean(result && result.decision !== "pending");
}

export function formatConfidence(value: number): string {
  return `${value.toFixed(1)}%`;
}
