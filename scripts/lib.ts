import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type FieldType = "string" | "number" | "array";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  description: string;
  itemType?: "string";
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

export interface CategoryConfig {
  id: string;
  title: string;
  summary: string;
  tone: string;
  icon: string;
  accent: string;
  sampleId: string;
  docsNotes: string[];
  fields: FieldDefinition[];
}

export interface ValidationResult {
  entriesByCategory: Record<string, Record<string, unknown>[]>;
  errors: string[];
}

type EntryRecord = Record<string, unknown>;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(scriptDir, "..");
export const CONTENT_DIR = path.join(ROOT_DIR, "content");
export const DOCS_DIR = path.join(ROOT_DIR, "docs");
export const API_DIR = path.join(DOCS_DIR, "api", "v1");
export const SCHEMAS_DIR = path.join(DOCS_DIR, "schemas");

export const SITE_NAME = "MemeOps";
export const SITE_TAGLINE =
  "A static API for operational truth, architectural regret, and enterprise-grade nonsense.";
export const PUBLIC_SITE_URL = "https://tengfone.github.io/memeops/";
export const PUBLIC_API_URL = "https://tengfone.github.io/memeops/api/v1/";
export const API_VERSION = "v1";
export const CONTENT_VERSION = "1.0.0";

const stringField = (
  name: string,
  description: string,
  options: Omit<Partial<FieldDefinition>, "name" | "type" | "description"> = {}
): FieldDefinition => ({
  name,
  type: "string",
  description,
  ...options
});

const numberField = (
  name: string,
  description: string,
  options: Omit<Partial<FieldDefinition>, "name" | "type" | "description"> = {}
): FieldDefinition => ({
  name,
  type: "number",
  description,
  ...options
});

const arrayField = (
  name: string,
  description: string,
  options: Omit<Partial<FieldDefinition>, "name" | "type" | "description" | "itemType"> = {}
): FieldDefinition => ({
  name,
  type: "array",
  itemType: "string",
  description,
  ...options
});

export const BASE_FIELDS: FieldDefinition[] = [
  stringField("id", "Stable slug for the entry."),
  stringField("category", "Category slug used in API paths."),
  stringField("title", "Display title."),
  stringField("summary", "Short, high-signal description."),
  arrayField("tags", "Searchable tags for browsing and filtering."),
  stringField("tone", "Primary writing mode."),
  stringField("version", "Content object schema version."),
  stringField("created_at", "Initial publication date in ISO local date form."),
  stringField("updated_at", "Most recent update date in ISO local date form.")
];

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: "architecture",
    title: "Architecture",
    summary:
      "Judgment lines for expensive technical posture, decorative scale, and self-inflicted distributed systems.",
    tone: "dry",
    icon: "ARC",
    accent: "#635bff",
    sampleId: "architecture-0001",
    docsNotes: [
      "These entries roast complexity, not ambition.",
      "Use them when a diagram has more moving parts than active users."
    ],
    fields: [
      stringField("verdict", "Shortest possible judgment line."),
      stringField("severity", "Complexity damage level.", {
        enum: ["low", "medium", "high", "critical"]
      }),
      stringField("why_it_happens", "Why teams still choose this shape."),
      stringField("recommended_fix", "Boring replacement move.")
    ]
  },
  {
    id: "incident",
    title: "Incident",
    summary:
      "Operationally polished phrases for outages, near misses, and the art of saying the system was fine until users touched it.",
    tone: "operational",
    icon: "INC",
    accent: "#0a7cff",
    sampleId: "incident-0001",
    docsNotes: [
      "These lines should sound plausible in a tired comms channel.",
      "Credibility reflects how long the sentence buys you before follow-up questions."
    ],
    fields: [
      stringField("excuse", "The polished line as it would appear in the wild."),
      stringField("translation", "Plain-language meaning."),
      stringField("delivery_context", "Where the line is usually deployed."),
      numberField("credibility", "Estimated believability from 0 to 1.", {
        minimum: 0,
        maximum: 1
      }),
      stringField("when_to_use", "Conditions that make the excuse survivable."),
      stringField("when_it_fails", "Audience or evidence that ruins it immediately.")
    ]
  },
  {
    id: "agent",
    title: "Agent",
    summary:
      "Performance reviews for coding agents, prompt workers, and synthetic coworkers who move faster than their consequences.",
    tone: "fake-hr",
    icon: "AGT",
    accent: "#24b47e",
    sampleId: "agent-0001",
    docsNotes: [
      "These reviews should sound calm while describing real operational risk.",
      "Reliability is a score, not an act of faith."
    ],
    fields: [
      stringField("performance_rating", "Fake HR performance band.", {
        enum: [
          "needs-improvement",
          "meets-expectations",
          "exceeds-expectations"
        ]
      }),
      numberField("reliability_score", "Operational trust score from 0 to 100.", {
        minimum: 0,
        maximum: 100
      }),
      stringField("hallucination_risk", "Observed tendency to invent reality.", {
        enum: ["low", "medium", "high"]
      }),
      stringField("escalation_readiness", "Likelihood that it asks for help before damage.", {
        enum: ["low", "medium", "high"]
      }),
      arrayField("strengths", "Behaviors a manager can say with a straight face."),
      arrayField("improvement_areas", "Behaviors threatening the roadmap or pager."),
      stringField("promotion_readiness", "Whether more autonomy is survivable.", {
        enum: ["not-yet", "ready-with-oversight", "under-observation"]
      }),
      stringField("manager_note", "One last sentence that should probably stay internal.")
    ]
  },
  {
    id: "decision",
    title: "Decision",
    summary:
      "Opinionated answers for recurring engineering choices that usually get over-discussed and under-bounded.",
    tone: "opinionated",
    icon: "DEC",
    accent: "#0ea5e9",
    sampleId: "decision-0001",
    docsNotes: [
      "The useful answer is usually the one with less ceremony.",
      "Confidence should rise when the boring option is obviously correct."
    ],
    fields: [
      stringField("question", "Decision prompt posed in plain language."),
      stringField("answer", "Recommended choice."),
      numberField("confidence", "Confidence from 0 to 1.", {
        minimum: 0,
        maximum: 1
      }),
      stringField("reason", "Why the answer is operationally defensible."),
      stringField("anti_pattern", "The common bad move this oracle is trying to stop."),
      stringField("when_to_reconsider", "Condition under which the answer changes.")
    ]
  },
  {
    id: "postmortem",
    title: "Postmortem",
    summary:
      "Mock incident narratives that read like real operational pain with better grammar and fewer redactions.",
    tone: "postmortem",
    icon: "PMT",
    accent: "#ef4444",
    sampleId: "postmortem-0001",
    docsNotes: [
      "These entries should feel like incidents you could plausibly have suffered through.",
      "Keep the lesson sharp enough to outlive the meeting."
    ],
    fields: [
      stringField("failure_pattern", "Named failure shape described in the write-up."),
      stringField("customer_impact", "What users experienced."),
      stringField("root_cause", "Actual technical cause."),
      stringField("lesson", "What the team should stop pretending not to know."),
      stringField("corrective_action", "Follow-up move with real leverage.")
    ]
  },
  {
    id: "severity",
    title: "Severity",
    summary:
      "Corporate-language translators for outages, degradation notices, and carefully managed understatement.",
    tone: "plain-truth",
    icon: "SEV",
    accent: "#f59e0b",
    sampleId: "severity-0001",
    docsNotes: [
      "The point is translation, not diplomacy.",
      "Treat the recommended message as emotionally honest default copy."
    ],
    fields: [
      stringField("phrase", "Original corporate or incident phrase."),
      stringField("translation", "What it means in plain language."),
      stringField("escalation_level", "Implied urgency level.", {
        enum: ["low", "medium", "high", "critical"]
      }),
      stringField("blast_radius", "How wide the problem feels from the outside."),
      stringField("recommended_message", "Clearer sentence to use instead.")
    ]
  },
  {
    id: "token",
    title: "Token",
    summary:
      "Judgment for wasteful AI usage, budget theater, and prompt loops that should have been one comment.",
    tone: "meta",
    icon: "TOK",
    accent: "#9333ea",
    sampleId: "token-0001",
    docsNotes: [
      "Token guilt works best when the spend and outcome are both painfully legible.",
      "Finance language should remain just formal enough to sting."
    ],
    fields: [
      numberField("token_spend", "Estimated token count consumed.", {
        minimum: 0
      }),
      stringField("waste_pattern", "The way the spend became embarrassing."),
      stringField("guilt_level", "Waste severity level.", {
        enum: ["low", "medium", "high", "critical"]
      }),
      stringField("better_use", "Something more defensible to spend the credits on."),
      stringField("finance_note", "Dry financial commentary on the decision.")
    ]
  },
  {
    id: "startup",
    title: "Startup",
    summary:
      "Absurd but plausible company ideas for an economy still trying to expense its way into product truth.",
    tone: "venture",
    icon: "STP",
    accent: "#ec4899",
    sampleId: "startup-0001",
    docsNotes: [
      "The joke lands when the buyer and pain are almost credible.",
      "Moats should sound fundable and operationally suspect."
    ],
    fields: [
      stringField("pitch", "Short company description."),
      stringField("buyer", "Who would allegedly pay for this."),
      stringField("moat", "Reason it claims to be defensible."),
      stringField("risk", "Most obvious structural problem."),
      stringField("investor_reaction", "Likely response from a warmed-up partner meeting.")
    ]
  },
  {
    id: "observability",
    title: "Observability",
    summary:
      "Signals, dashboards, and telemetry patterns that look useful right up until someone asks for an answer.",
    tone: "diagnostic",
    icon: "OBS",
    accent: "#06b6d4",
    sampleId: "observability-0001",
    docsNotes: [
      "These entries describe instrumentation posture more than instrumentation coverage.",
      "The next move should create clarity, not more charts."
    ],
    fields: [
      stringField("signal", "What the system appeared to be telling you."),
      stringField("false_signal", "Why that signal was comforting but wrong."),
      stringField("actual_problem", "The thing that was really broken."),
      stringField("next_move", "Highest-leverage diagnostic step."),
      stringField("confidence_gap", "Why the team felt informed without actually knowing.")
    ]
  },
  {
    id: "deploy",
    title: "Deploy",
    summary:
      "Release patterns, rollback anxiety, and deployment language that sounds routine until the hidden dependency logs in.",
    tone: "release",
    icon: "DPL",
    accent: "#10b981",
    sampleId: "deploy-0001",
    docsNotes: [
      "These entries should read like a release note written by someone already opening rollback tabs.",
      "Containment is what kept the incident from gaining a name."
    ],
    fields: [
      stringField("release_type", "Kind of deployment or rollout."),
      stringField("rollback_risk", "How ugly rollback is likely to get.", {
        enum: ["low", "medium", "high", "critical"]
      }),
      stringField("hidden_dependency", "Dependency that turns routine into special."),
      stringField("operator_note", "What the release operator would say privately."),
      stringField("containment", "Move that keeps the blast radius bounded.")
    ]
  },
  {
    id: "runbook",
    title: "Runbook",
    summary:
      "Operational procedure fragments for incidents where the official playbook contains equal parts wisdom and superstition.",
    tone: "procedural",
    icon: "RUN",
    accent: "#14b8a6",
    sampleId: "runbook-0001",
    docsNotes: [
      "The best runbooks distinguish signal from ritual.",
      "Exit conditions matter more than number of steps."
    ],
    fields: [
      stringField("symptom", "Problem signature the runbook addresses."),
      stringField("first_step", "First action in the flow."),
      stringField("second_step", "Second action after basic triage."),
      stringField("trap", "Common step that wastes time or confidence."),
      stringField("exit_condition", "Condition that means the runbook worked.")
    ]
  },
  {
    id: "latency",
    title: "Latency",
    summary:
      "Response-time narratives for systems that stayed alive just long enough to ruin trust instead of availability charts.",
    tone: "weary",
    icon: "LAT",
    accent: "#38bdf8",
    sampleId: "latency-0001",
    docsNotes: [
      "These entries should make room for both dashboard shape and customer pain.",
      "Mitigation should sound more useful than the average war-room suggestion."
    ],
    fields: [
      stringField("suspected_cause", "What people blamed first."),
      stringField("actual_cause", "What was really responsible."),
      stringField("mitigation", "Fastest practical move to buy time."),
      stringField("graph_shape", "How the metric looked from the outside."),
      stringField("customer_story", "How the issue showed up in real usage.")
    ]
  },
  {
    id: "oncall",
    title: "Oncall",
    summary:
      "Pages, moods, coping patterns, and the thin layer of professionalism separating investigation from folklore.",
    tone: "oncall",
    icon: "ONC",
    accent: "#fb7185",
    sampleId: "oncall-0001",
    docsNotes: [
      "Operator mood belongs in the format because everyone can already see it.",
      "Scar tissue is accumulated system knowledge with worse branding."
    ],
    fields: [
      stringField("page_reason", "Why the page fired."),
      stringField("operator_mood", "Most accurate emotional state during triage."),
      stringField("investigation_path", "How the investigation actually unfolded."),
      stringField("resolution", "What finally stabilized reality."),
      stringField("scar_tissue", "What this incident permanently taught the team.")
    ]
  },
  {
    id: "migration",
    title: "Migration",
    summary:
      "System moves, platform replacements, and the hidden invoices carried by every supposedly straightforward cutover.",
    tone: "transitional",
    icon: "MIG",
    accent: "#22c55e",
    sampleId: "migration-0001",
    docsNotes: [
      "The hidden cost should be something a senior engineer would actually fear.",
      "Safest path usually means slower, uglier, and more honest."
    ],
    fields: [
      stringField("source", "System or posture being left behind."),
      stringField("target", "System or posture being moved to."),
      stringField("migration_style", "How the team plans to move."),
      stringField("hidden_cost", "What the plan is underpricing."),
      stringField("safest_path", "Less glamorous way to do it.")
    ]
  },
  {
    id: "review",
    title: "Review",
    summary:
      "Pull request and design review lines where the visible comment and the actual concern are politely decoupled.",
    tone: "reviewer",
    icon: "REV",
    accent: "#6366f1",
    sampleId: "review-0001",
    docsNotes: [
      "The comment text and the subtext should both be useful.",
      "Mergeability is social truth wearing process language."
    ],
    fields: [
      stringField("feedback", "Comment as written in the review."),
      stringField("subtext", "What the reviewer actually means."),
      stringField("severity", "How blocking the feedback really is.", {
        enum: ["low", "medium", "high", "critical"]
      }),
      stringField("action", "Best next move for the author."),
      stringField("mergeability", "Practical merge status.", {
        enum: ["blocked", "needs-context", "ready-with-risk", "ship-it"]
      })
    ]
  },
  {
    id: "compliance",
    title: "Compliance",
    summary:
      "Formal control language for environments where the spreadsheet, the screenshot, and the human memory are still technically part of the system.",
    tone: "bureaucratic",
    icon: "CMP",
    accent: "#0f766e",
    sampleId: "compliance-0001",
    docsNotes: [
      "Keep the control posture polished and the plain truth sharper than it wants to be.",
      "Compensating control is where operational character becomes visible."
    ],
    fields: [
      stringField("control_area", "Named area under review."),
      stringField("plain_truth", "What the control posture actually depends on."),
      stringField("auditability", "How defensible the evidence chain is.", {
        enum: ["low", "medium", "high"]
      }),
      stringField("compensating_control", "Fallback control carrying too much weight."),
      stringField("operator_comment", "Private explanation from the people keeping it alive.")
    ]
  },
  {
    id: "roadmap",
    title: "Roadmap",
    summary:
      "Promises, dependencies, and strategic hedges for plans that are one staffing change away from becoming philosophy.",
    tone: "roadmap",
    icon: "RMP",
    accent: "#f97316",
    sampleId: "roadmap-0001",
    docsNotes: [
      "A roadmap item is a social contract with poor error handling.",
      "The hedge should sound familiar to anyone who has shipped through reorg season."
    ],
    fields: [
      stringField("promise", "Thing the roadmap says is coming."),
      stringField("actual_dependency", "What really has to happen first."),
      stringField("delivery_risk", "Likelihood that the date is fiction.", {
        enum: ["low", "medium", "high", "critical"]
      }),
      stringField("truth", "Most honest sentence about the item."),
      stringField("hedge", "How the commitment gets phrased to survive reality.")
    ]
  },
  {
    id: "meeting",
    title: "Meeting",
    summary:
      "Recurring calendar rituals for alignment, deniability, and the steady conversion of ambiguity into notes no one will reopen.",
    tone: "meeting-room",
    icon: "MTG",
    accent: "#8b5cf6",
    sampleId: "meeting-0001",
    docsNotes: [
      "The stated goal and actual goal should disagree in a realistic way.",
      "Output is what remains after everyone stops talking."
    ],
    fields: [
      stringField("meeting_type", "Type of meeting or ritual."),
      stringField("stated_goal", "Official reason the calendar invite exists."),
      stringField("actual_goal", "What the room is really trying to accomplish."),
      stringField("output", "Most likely artifact or conclusion."),
      stringField("survivability", "Likelihood of leaving with usable clarity.", {
        enum: ["low", "medium", "high"]
      })
    ]
  },
  {
    id: "ticket",
    title: "Ticket",
    summary:
      "Backlog requests for work that arrived disguised as a small ask and quietly unfolded into cross-team archaeology.",
    tone: "backlog",
    icon: "TKT",
    accent: "#e11d48",
    sampleId: "ticket-0001",
    docsNotes: [
      "The hidden work should make the summary feel immediately suspicious.",
      "Truthful status is different from what the tracker can tolerate."
    ],
    fields: [
      stringField("request", "Thing the ticket appears to ask for."),
      stringField("hidden_work", "Real effort concealed by the description."),
      stringField("priority", "Practical urgency level.", {
        enum: ["low", "medium", "high", "critical"]
      }),
      stringField("truthful_status", "What the ticket state should really say."),
      stringField("expected_response", "Most reasonable answer from the owner.")
    ]
  },
  {
    id: "platform",
    title: "Platform",
    summary:
      "Internal platform offerings, adoption theater, and the steady translation of one team’s preference into everyone else’s workflow.",
    tone: "platform",
    icon: "PLT",
    accent: "#2563eb",
    sampleId: "platform-0001",
    docsNotes: [
      "The best platform jokes are about ownership and incentives, not abstractions alone.",
      "Retirement plans are where honesty enters the roadmap."
    ],
    fields: [
      stringField("offering", "Named platform capability."),
      stringField("actual_job", "What the platform is really doing."),
      stringField("adoption_risk", "Likelihood of forced or performative adoption.", {
        enum: ["low", "medium", "high", "critical"]
      }),
      stringField("team_cost", "Cost paid by the team operating it."),
      stringField("retirement_plan", "How this should eventually be dismantled or absorbed.")
    ]
  }
];

const categoryMap = new Map(CATEGORY_CONFIGS.map((category) => [category.id, category]));

export function getCategoryConfig(categoryId: string): CategoryConfig {
  const config = categoryMap.get(categoryId);

  if (!config) {
    throw new Error(`Unknown category: ${categoryId}`);
  }

  return config;
}

export function getAllFields(categoryId: string): FieldDefinition[] {
  return [...BASE_FIELDS, ...getCategoryConfig(categoryId).fields];
}

export function getLocalApiPath(...parts: string[]): string {
  return `/api/v1/${parts.join("/")}`;
}

export function getPublicApiPath(...parts: string[]): string {
  return `${PUBLIC_API_URL}${parts.join("/")}`;
}

export function getIsoTimestamp(): string {
  return new Date().toISOString();
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function resetDirectory(targetDir: string): Promise<void> {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pushUniqueEntry(
  entry: EntryRecord,
  filePath: string,
  errors: string[],
  entries: EntryRecord[],
  seenIds: Set<string>
): void {
  if (typeof entry.id === "string") {
    if (seenIds.has(entry.id)) {
      errors.push(`${filePath}: duplicate entry id "${entry.id}".`);
      return;
    }

    seenIds.add(entry.id);
  }

  entries.push(entry);
}

function validateString(
  entry: Record<string, unknown>,
  fieldName: string,
  errors: string[],
  filePath: string,
  enums?: string[]
): void {
  const value = entry[fieldName];

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${filePath}: field "${fieldName}" must be a non-empty string.`);
    return;
  }

  if (enums && !enums.includes(value)) {
    errors.push(
      `${filePath}: field "${fieldName}" must be one of ${enums.join(", ")}.`
    );
  }
}

function validateStringArray(
  entry: Record<string, unknown>,
  fieldName: string,
  errors: string[],
  filePath: string
): void {
  const value = entry[fieldName];

  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => typeof item !== "string" || item.trim().length === 0)
  ) {
    errors.push(
      `${filePath}: field "${fieldName}" must be a non-empty array of strings.`
    );
  }
}

function validateNumber(
  entry: Record<string, unknown>,
  fieldName: string,
  errors: string[],
  filePath: string,
  minimum?: number,
  maximum?: number
): void {
  const value = entry[fieldName];

  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push(`${filePath}: field "${fieldName}" must be a number.`);
    return;
  }

  if (minimum !== undefined && value < minimum) {
    errors.push(`${filePath}: field "${fieldName}" must be >= ${minimum}.`);
  }

  if (maximum !== undefined && value > maximum) {
    errors.push(`${filePath}: field "${fieldName}" must be <= ${maximum}.`);
  }
}

function validateBaseFields(
  entry: Record<string, unknown>,
  categoryId: string,
  filePath: string,
  errors: string[]
): void {
  validateString(entry, "id", errors, filePath);
  validateString(entry, "category", errors, filePath);
  validateString(entry, "title", errors, filePath);
  validateString(entry, "summary", errors, filePath);
  validateString(entry, "tone", errors, filePath);
  validateString(entry, "version", errors, filePath);
  validateString(entry, "created_at", errors, filePath);
  validateString(entry, "updated_at", errors, filePath);
  validateStringArray(entry, "tags", errors, filePath);

  const id = entry.id;
  const category = entry.category;
  const version = entry.version;
  const createdAt = entry.created_at;
  const updatedAt = entry.updated_at;

  if (typeof id === "string" && !/^[a-z0-9-]+$/.test(id)) {
    errors.push(`${filePath}: field "id" must be a lowercase slug.`);
  }

  if (category !== categoryId) {
    errors.push(`${filePath}: field "category" must equal "${categoryId}".`);
  }

  if (typeof version === "string" && !/^\d+\.\d+\.\d+$/.test(version)) {
    errors.push(`${filePath}: field "version" must look like 1.0.0.`);
  }

  if (typeof createdAt === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
    errors.push(`${filePath}: field "created_at" must use YYYY-MM-DD.`);
  }

  if (typeof updatedAt === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) {
    errors.push(`${filePath}: field "updated_at" must use YYYY-MM-DD.`);
  }
}

function validateSpecificFields(
  entry: Record<string, unknown>,
  categoryId: string,
  filePath: string,
  errors: string[]
): void {
  const category = getCategoryConfig(categoryId);

  for (const field of category.fields) {
    if (field.type === "string") {
      validateString(entry, field.name, errors, filePath, field.enum);
      continue;
    }

    if (field.type === "number") {
      validateNumber(
        entry,
        field.name,
        errors,
        filePath,
        field.minimum,
        field.maximum
      );
      continue;
    }

    if (field.type === "array") {
      validateStringArray(entry, field.name, errors, filePath);
      continue;
    }
  }
}

export async function validateContent(): Promise<ValidationResult> {
  const errors: string[] = [];
  const entriesByCategory: Record<string, Record<string, unknown>[]> = {};

  for (const category of CATEGORY_CONFIGS) {
    const categoryDir = path.join(CONTENT_DIR, category.id);
    const seenIds = new Set<string>();
    let fileNames: string[] = [];

    try {
      fileNames = (await readdir(categoryDir))
        .filter((fileName) => fileName.endsWith(".json"))
        .sort();
    } catch {
      errors.push(`${categoryDir}: category directory is missing.`);
      entriesByCategory[category.id] = [];
      continue;
    }

    entriesByCategory[category.id] = [];

    for (const fileName of fileNames) {
      const filePath = path.join(categoryDir, fileName);
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          errors.push(`${filePath}: entry array must not be empty.`);
          continue;
        }

        for (const [index, entry] of parsed.entries()) {
          const entryPath = `${filePath}[${index}]`;

          if (!isObject(entry)) {
            errors.push(`${entryPath}: entry must be a JSON object.`);
            continue;
          }

          validateBaseFields(entry, category.id, entryPath, errors);
          validateSpecificFields(entry, category.id, entryPath, errors);
          pushUniqueEntry(
            entry,
            entryPath,
            errors,
            entriesByCategory[category.id],
            seenIds
          );
        }

        continue;
      }

      if (!isObject(parsed)) {
        errors.push(`${filePath}: entry must be a JSON object or a non-empty array of objects.`);
        continue;
      }

      validateBaseFields(parsed, category.id, filePath, errors);
      validateSpecificFields(parsed, category.id, filePath, errors);

      if (typeof parsed.id === "string" && `${parsed.id}.json` !== fileName) {
        errors.push(`${filePath}: file name must match entry id.`);
      }

      pushUniqueEntry(
        parsed,
        filePath,
        errors,
        entriesByCategory[category.id],
        seenIds
      );
    }

    entriesByCategory[category.id].sort((left, right) =>
      String(left.title).localeCompare(String(right.title))
    );
  }

  return { entriesByCategory, errors };
}

function buildFieldSchema(field: FieldDefinition): Record<string, unknown> {
  if (field.type === "array") {
    return {
      type: "array",
      description: field.description,
      items: {
        type: field.itemType ?? "string"
      },
      minItems: 1
    };
  }

  const schema: Record<string, unknown> = {
    type: field.type,
    description: field.description
  };

  if (field.enum) {
    schema.enum = field.enum;
  }

  if (field.minimum !== undefined) {
    schema.minimum = field.minimum;
  }

  if (field.maximum !== undefined) {
    schema.maximum = field.maximum;
  }

  return schema;
}

export function buildSchema(categoryId: string): Record<string, unknown> {
  const category = getCategoryConfig(categoryId);
  const fields = getAllFields(categoryId);

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: `${category.title} Entry`,
    description: category.summary,
    type: "object",
    additionalProperties: false,
    required: fields.map((field) => field.name),
    properties: Object.fromEntries(
      fields.map((field) => [field.name, buildFieldSchema(field)])
    )
  };
}

export function buildCommonSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "MemeOps Base Entry",
    description: "Common fields shared by all MemeOps API entries.",
    type: "object",
    additionalProperties: true,
    required: BASE_FIELDS.map((field) => field.name),
    properties: Object.fromEntries(
      BASE_FIELDS.map((field) => [field.name, buildFieldSchema(field)])
    )
  };
}
