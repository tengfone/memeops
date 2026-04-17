import path from "node:path";
import {
  CATEGORY_CONFIGS,
  CONTENT_DIR,
  CONTENT_VERSION,
  resetDirectory,
  writeJson
} from "./lib.ts";

type EntryRecord = Record<string, unknown>;
type EntryGenerator = (index: number) => EntryRecord;

const ENTRY_COUNT_PER_CATEGORY = 1000;
const ENTRY_DATE = "2026-04-17";
const SEVERITY_SCALE = ["low", "medium", "high", "critical"] as const;
const SIMPLE_SCALE = ["low", "medium", "high"] as const;
const MERGEABILITY = [
  "blocked",
  "needs-context",
  "ready-with-risk",
  "ship-it"
] as const;
const PROMOTION = [
  "not-yet",
  "ready-with-oversight",
  "under-observation"
] as const;
const PERFORMANCE = [
  "needs-improvement",
  "meets-expectations",
  "exceeds-expectations"
] as const;

function digits(index: number): { a: number; b: number; c: number } {
  return {
    a: index % 10,
    b: Math.floor(index / 10) % 10,
    c: Math.floor(index / 100) % 10
  };
}

function padEntry(index: number): string {
  return String(index + 1).padStart(4, "0");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function makeTags(...values: string[]): string[] {
  return [...new Set(values.map(slugify).filter(Boolean))].slice(0, 6);
}

function titleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function baseEntry(
  category: string,
  index: number,
  tone: string,
  title: string,
  summary: string,
  tags: string[]
): EntryRecord {
  return {
    id: `${category}-${padEntry(index)}`,
    category,
    title,
    summary,
    tags,
    tone,
    version: CONTENT_VERSION,
    created_at: ENTRY_DATE,
    updated_at: ENTRY_DATE
  };
}

const platforms = [
  "Event Bus",
  "Workflow Engine",
  "Lakehouse Program",
  "GPU Queue",
  "Policy Mesh",
  "Vector Pipeline",
  "Microservice Fleet",
  "Streaming Backbone",
  "Service Mesh",
  "Feature Platform"
];
const workloads = [
  "a weekly finance digest",
  "three-person admin tooling",
  "a once-a-day rollup",
  "spreadsheet automation",
  "an internal approval form",
  "a dashboard export job",
  "customer CSV imports",
  "an onboarding checklist",
  "a billing retry cron",
  "a support escalation form"
];
const architectureMotives = [
  "future scale was discussed before present traffic arrived",
  "the team wanted the diagram to look venture-compatible",
  "platform posture was mistaken for product progress",
  "everyone was optimizing for architecture review theatre",
  "the org confused optionality with professionalism",
  "distributed systems felt safer than making a small call",
  "nobody wanted to be seen choosing the boring tool",
  "a previous outage was interpreted as a mandate for more layers",
  "ownership boundaries were designed before the workload existed",
  "tooling ambition outran the number of users"
];
const boringFixes = [
  "a single service and a queue",
  "a database table and one job",
  "plain application code",
  "a cron schedule and metrics",
  "one cache and fewer meetings",
  "a feature flag and a rollback plan",
  "a batch job with logs",
  "a boring API and sane ownership",
  "one worker with retries",
  "a smaller diagram and faster judgment"
];

const incidentLines = [
  "Health checks were green",
  "The rollout succeeded technically",
  "We saw elevated latency",
  "A downstream dependency degraded first",
  "Traffic exceeded our optimistic assumptions",
  "The system remained partially available",
  "This impacted a subset of workflows",
  "We observed intermittent failures",
  "Background processing fell behind",
  "Automatic recovery was slower than intended"
];
const incidentContexts = [
  "the exec channel",
  "a status page draft",
  "the customer success war room",
  "an incident retrospective",
  "a regional paging event",
  "a rollback thread",
  "the weekly reliability review",
  "the support escalation queue",
  "an architecture postmortem",
  "the launch readiness meeting"
];
const incidentTruths = [
  "business reality was red while the dashboards stayed politely green",
  "the system passed its own checks and still failed user intent",
  "we shipped into a dependency graph nobody had fully mapped",
  "we bought ourselves minutes instead of resolution",
  "a queue hid the pain until customers arrived faster than workers",
  "the cache protected the graphs more than the product",
  "the fallback path was technically present and operationally imaginary",
  "we mistook partial availability for acceptable behavior",
  "the alerting posture was tidy while the failure mode was not",
  "coordination failed before infrastructure did"
];
const incidentUse = [
  "you need one sentence before the facts stop moving",
  "support already knows users are angry",
  "the incident commander needs time to verify scope",
  "leadership wants status language before they want detail",
  "there is still a plausible path to rapid recovery",
  "the blast radius is real but not yet named",
  "you are communicating to customers who already saw the failure",
  "a rollback is running and no one wants two narratives",
  "you need to acknowledge pain without inventing precision",
  "the evidence is incomplete but silence is worse"
];
const incidentFails = [
  "logs show the product was unavailable the whole time",
  "support screenshots contradict the sentence immediately",
  "the timeline reveals the team knew earlier than the message implies",
  "customers can reproduce the issue while reading the update",
  "there is a clear ownership gap and everyone can see it",
  "the issue is tied to a release that already has a name",
  "query traces point at a decision everyone just defended",
  "the business metric graph looks like a cliff",
  "the workaround fails in front of the stakeholder call",
  "a dependency owner replies with their own receipts"
];

const agentTypes = [
  "Frontend Refactor Bot",
  "Test Repair Agent",
  "Migration Copilot",
  "PR Summary Worker",
  "Spec Diff Bot",
  "Infra Triage Agent",
  "Prompt Routing Clerk",
  "Repo Cleanup Worker",
  "Schema Nudge Bot",
  "Release Note Agent"
];
const agentScopes = [
  "design system cleanup",
  "pagination test fixes",
  "database schema drift",
  "incident ticket summarization",
  "monorepo search and replace",
  "api client regeneration",
  "typed form rewrites",
  "release branch preparation",
  "terraform variable normalization",
  "observability config updates"
];
const agentStrengths = [
  "renames things decisively",
  "writes crisp summaries",
  "finds the obvious file quickly",
  "stays productive under shallow context",
  "produces plausible code comments",
  "keeps momentum in repetitive edits",
  "survives vague prompts better than expected",
  "formats output cleanly",
  "moves across files without complaint",
  "generates sensible first drafts"
];
const agentRisks = [
  "deletes edge cases with managerial confidence",
  "assumes green tests mean correct behavior",
  "treats comments as requirements and requirements as optional",
  "forgets historical reasons the code looks odd",
  "prefers local neatness over production continuity",
  "hallucinates helper functions under pressure",
  "reads half the call path and commits emotionally",
  "patches symptoms while renaming the disease",
  "optimizes for diff aesthetics instead of blast radius",
  "gets bold whenever the review queue is quiet"
];
const agentManagers = [
  "Strong initiative. Uneven respect for consequences.",
  "Fast learner. Still dangerous around ambiguity.",
  "Helpful under supervision. Romantic about cleanup.",
  "Communicates clearly. Changes too much at once.",
  "Great tempo. Needs stronger attachment to reality.",
  "Useful in bounded tasks. Risky in open terrain.",
  "Professional tone. Casual relationship with edge cases.",
  "High throughput. Mixed relationship with production history.",
  "Makes progress. Needs more reverence for old outages.",
  "Improving. Should escalate before being inspirational."
];

const decisionPairs = [
  { left: "cron", right: "event-driven", recommended: "left" as const },
  { left: "queue", right: "direct call", recommended: "right" as const },
  { left: "cache", right: "database", recommended: "right" as const },
  { left: "rollup table", right: "read-time query", recommended: "left" as const },
  { left: "container job", right: "lambda", recommended: "left" as const },
  { left: "search index", right: "admin query", recommended: "right" as const },
  { left: "batch inference", right: "sync request", recommended: "left" as const },
  { left: "read replica", right: "primary", recommended: "left" as const },
  { left: "feature flag", right: "config file", recommended: "left" as const },
  { left: "workflow engine", right: "plain code", recommended: "right" as const }
];
const decisionScenarios = [
  "daily billing reconciliation",
  "internal dashboard filtering",
  "product catalog autocomplete",
  "csv export generation",
  "partner webhook retries",
  "support-only admin search",
  "weekly model evaluation",
  "email digest assembly",
  "ops approval routing",
  "customer data backfill"
];
const decisionConstraints = [
  "one owning team and predictable load",
  "bounded write volume and human operators",
  "an audience that cares more about reliability than elegance",
  "retry semantics you can explain in one minute",
  "a workload that already fits in a single service",
  "a blast radius that grows with every extra hop",
  "operational support handled by a small tired team",
  "a timeline shorter than the platform proposal",
  "requirements that are concrete but not glamorous",
  "failure modes that get worse when orchestration multiplies"
];
const decisionReconsider = [
  "the workload becomes multi-region and user-facing",
  "latency requirements move from seconds to milliseconds",
  "ownership splits across teams with conflicting cadences",
  "compliance creates hard audit boundaries",
  "the retry story stops fitting in one diagram",
  "throughput doubles often enough to matter",
  "a second critical consumer appears",
  "the product promise changes from batch to interactive",
  "the cost model starts dominating architecture choices",
  "the boring option no longer survives failure testing"
];

const postmortemPatterns = [
  "stale read model",
  "confident model gateway",
  "cost-optimized latency spike",
  "feature flag misfire",
  "overloaded retry queue",
  "partial region dependency",
  "silent backfill corruption",
  "identity cache drift",
  "workflow dead-letter pileup",
  "schema mismatch cascade"
];
const postmortemTriggers = [
  "a Friday rollout",
  "a regional failover rehearsal",
  "an emergency config patch",
  "a routine dependency upgrade",
  "a traffic spike nobody respected",
  "a cost optimization sprint",
  "a silent partner API change",
  "an internal tools migration",
  "a backfill started during peak hours",
  "an oncall handoff with missing context"
];
const postmortemImpacts = [
  "customers saw duplicate states and distrusted the product",
  "support spent hours arguing with the dashboard",
  "orders completed technically but not emotionally",
  "operators were forced into manual cleanup with partial evidence",
  "user sessions survived while data truth did not",
  "retries amplified pain instead of resolving it",
  "the product remained up while the outcome quietly failed",
  "teams lost half a day reconstructing reality",
  "internal tools gave executives the wrong calm",
  "the rollback protected uptime more than correctness"
];
const postmortemCauses = [
  "an ownership gap around shared state",
  "a queue depth alarm tuned for optimism instead of traffic",
  "a fallback path nobody had run in anger",
  "version skew between the producer and the only thing that mattered",
  "a cache invalidation path designed like a wish",
  "hidden coupling through one undocumented job",
  "manual recovery steps that assumed a specific operator",
  "a retry policy that multiplied load during the worst moment",
  "missing product-level assertions around business truth",
  "a dependency contract everyone thought someone else owned"
];
const postmortemLessons = [
  "platform neatness is not the same thing as product correctness",
  "partial availability still counts as failure when workflows depend on sequence",
  "runbooks need facts, not archeology",
  "fallbacks are features and deserve rehearsal",
  "latency budgets do not excuse truth decay",
  "every shared queue eventually becomes an ownership document",
  "you cannot delegate critical reasoning to dashboards alone",
  "cost optimization needs a blast-radius model before a kickoff slide",
  "manual steps are part of the system whether anyone admits it or not",
  "the cleanest rollback is still downstream of earlier judgment"
];
const postmortemActions = [
  "add end-to-end business assertions and alert on them",
  "move recovery steps out of tribal memory and into tooling",
  "force dependency ownership into the deploy path",
  "test fallback behavior under real traffic shape",
  "reduce queue fan-out before it becomes policy",
  "separate operator dashboards from executive comfort graphs",
  "bound retries by downstream health instead of hope",
  "require state version checks at the edges",
  "make manual remediation boring and documented",
  "remove one layer that exists mostly for status"
];

const severityPhrases = [
  "elevated latency",
  "temporary degradation",
  "downstream issue",
  "partial availability",
  "higher than normal error rates",
  "intermittent failures",
  "delayed processing",
  "slower than expected recovery",
  "reduced functionality",
  "service instability"
];
const severityTruths = [
  "it is kind of on fire",
  "we are buying time while the queue grows teeth",
  "someone else broke first and we are participating",
  "the happy path exists but the product no longer does",
  "requests are surviving just long enough to disappoint users",
  "the system is up in a way only graphs appreciate",
  "the workaround is carrying more dignity than the platform",
  "operators are stitching together a temporary reality",
  "we are one cache miss away from a worse incident",
  "the status page is working harder than the service"
];
const severityBlasts = [
  "one workflow at a time",
  "a visible subset of customers",
  "everybody important and several people loud",
  "mostly internal until revenue notices",
  "all users who expect fresh data",
  "the region that always looked fine on the map",
  "support first and product second",
  "the critical path disguised as a side path",
  "one integration too many",
  "anyone unlucky enough to refresh twice"
];
const severityMessages = [
  "We are actively recovering the affected workflow and validating product truth, not just process health.",
  "The service is reachable, but parts of the product are not behaving correctly for users right now.",
  "We restored basic availability and are now repairing correctness and backlog impact.",
  "The issue is bounded, but the affected path is important enough that we are treating it as urgent.",
  "We are seeing user-visible failure and are prioritizing cleanup over optimistic estimates.",
  "The platform is responsive while some outcomes remain wrong, and we are fixing both.",
  "Recovery is underway and we are validating the work against customer behavior rather than dashboards alone.",
  "A dependency issue is affecting our product path and we are mitigating directly while coordination continues.",
  "We have reduced the impact and are now draining the side effects caused during the incident.",
  "We are operationally stable enough to communicate and not stable enough to declare success."
];

const tokenActivities = [
  "Renaming a button",
  "Drafting a landing page rewrite",
  "Reformatting a config file",
  "Arguing with a flaky test",
  "Generating product copy variants",
  "Summarizing an obvious PR",
  "Asking a model to explain its own diff",
  "Producing ten architecture options nobody needed",
  "Creating meeting recap prose",
  "Rewording a tooltip"
];
const tokenWaste = [
  "a premium autocomplete bill",
  "recursive prompt reassurance",
  "a confidence loop with no net new information",
  "five versions of the same acceptable answer",
  "design indecision disguised as exploration",
  "a costly way to avoid making one call",
  "large-model ceremony around a small edit",
  "prompt inflation with executive formatting",
  "token-rich paraphrasing of already-good copy",
  "synthetic diligence for a human-sized task"
];
const tokenBetterUses = [
  "eval coverage around actual regressions",
  "content generation for new collections",
  "a proper migration dry run",
  "test data that reproduces reality",
  "documentation that would survive turnover",
  "a useful CLI that saves real minutes",
  "instrumentation around painful workflows",
  "curated postmortems with operational lessons",
  "a backlog cleanup with real decisions",
  "response cards that help support during incidents"
];
const tokenFinance = [
  "Finance accepts experimentation and not ritualized indecision.",
  "The unit economics worsen when the output could have been a sentence.",
  "This spend reads like anxiety with a budget owner.",
  "The cost is defensible only if the team learns something durable.",
  "The invoice implies a stronger result than the artifact does.",
  "This is cheaper than a meeting and more expensive than judgment.",
  "The credits moved quickly while the decision did not.",
  "The burn rate says platform; the artifact says draft.",
  "A finance partner would call this exploratory until they saw the volume.",
  "The organization paid premium rates for basic conviction."
];

const startupIdeas = [
  "Compliance-native workflow copilots",
  "Postmortem intelligence platforms",
  "AI governance for vibes-based development",
  "Observability for executive reassurance",
  "Runbook automation for human indecision",
  "Contract testing for startup promises",
  "Latency posture analytics",
  "Agent management for prompt-heavy teams",
  "Architecture review as a service",
  "Status page orchestration for multi-team blame"
];
const startupBuyers = [
  "platform teams with headcount envy",
  "seed-stage founders with enterprise aspirations",
  "AI builders who already spent too much",
  "product orgs with calendar trauma",
  "compliance teams that inherited modern tooling",
  "reliability leaders under board attention",
  "internal tools teams trying to sound strategic",
  "ops managers with too many dashboards",
  "dev productivity groups seeking a narrative",
  "companies preparing for their first painful audit"
];
const startupMoats = [
  "proprietary incident corpora",
  "workflow lock-in through templates everyone hates but uses",
  "deep integration with the meetings that create the problem",
  "historical prompt data nobody should be proud of",
  "a graph of who actually owns what",
  "audit logs too annoying to rebuild elsewhere",
  "network effects among teams with identical pain",
  "compliance wrappers around ordinary coordination",
  "a polished interface for institutional guilt",
  "the cost of switching once everyone has learned the euphemisms"
];
const startupRisks = [
  "the product is mostly a nicer way to admit process debt",
  "buyers might prefer one spreadsheet and fewer promises",
  "the moat vanishes if teams start telling the truth directly",
  "adoption depends on leaders acknowledging the actual problem",
  "the feature roadmap sounds suspiciously like consulting",
  "the platform story collapses under a serious security review",
  "the biggest competitor is a calmer operating model",
  "the company could become a very expensive shared folder",
  "revenue depends on recurring embarrassment",
  "the pitch confuses workflow volume with market size"
];
const startupInvestor = [
  "asks for a pilot and quietly ignores the valuation",
  "likes the slide deck more than the retention story",
  "calls it category-defining and means it as a question",
  "hears enterprise urgency and smells service revenue",
  "wants proof that the pain repeats outside your friend group",
  "asks what happens when teams just make one decision sooner",
  "likes the founder energy and doubts the buyer budget",
  "hears platform upside and wonders about churn gravity",
  "calls the moat interesting and the distribution unclear",
  "wants to know whether the workflow still exists in a normal org"
];

const observabilitySignals = [
  "A green SLO panel",
  "A stable queue depth chart",
  "A neat dashboard of retries",
  "A low infrastructure error rate",
  "A clean deployment health widget",
  "A reassuring replica lag graph",
  "A perfectly shaped throughput panel",
  "A quiet alert feed",
  "An elegant trace sample",
  "A calm cost monitoring board"
];
const observabilityFalseSignals = [
  "it measured mechanics instead of outcomes",
  "the threshold was tuned to protect sleep rather than truth",
  "the panel hid long-tail pain behind an average",
  "customer-visible errors happened after the graph stopped caring",
  "the system looked alive while business state drifted",
  "it assumed one failure mode and met a different one",
  "the dashboard answered a prettier question than the incident asked",
  "sampling removed the only requests anyone needed",
  "the signal arrived after support already had the timeline",
  "nobody owned the metric once it turned inconvenient"
];
const observabilityProblems = [
  "state was stale enough to break trust",
  "workers were retrying into saturation",
  "a dependency contract had quietly shifted",
  "a rollback restored uptime but not correctness",
  "backfill traffic starved the interactive path",
  "an internal cache hid the real blast radius",
  "one tenant consumed the system's patience",
  "batch work spilled into customer time",
  "ownership stopped at the first service boundary",
  "the fallback path changed product meaning"
];
const observabilityMoves = [
  "trace one real customer flow end to end",
  "add product-level assertions before another graph",
  "page on business correctness instead of component health",
  "instrument queue age rather than queue existence",
  "tie deploy metadata to user-visible regressions",
  "log the decision points, not just the failures",
  "surface stale-state duration as a first-class signal",
  "capture replayable payloads for the broken path",
  "measure backlog drain time under active mitigation",
  "assign an owner to the metric before the next review"
];
const observabilityGaps = [
  "the team had coverage but not interpretation",
  "graphs existed without product truth attached",
  "everyone could see the system and nobody could answer the incident",
  "signal ownership was weaker than dashboard ownership",
  "the tools were mature and the questions were not",
  "monitoring stopped where cross-service behavior began",
  "the alert told you where to look and not what mattered",
  "people trusted the panel more than the customer report",
  "instrumentation was abundant and judgment was still manual",
  "visibility ended exactly where coordination started"
];

const deployTypes = [
  "Canary rollout",
  "Config-only push",
  "Hotfix release",
  "Schema migration deploy",
  "Background worker rollout",
  "Feature flag enablement",
  "Traffic shift",
  "SDK regeneration release",
  "Cache policy change",
  "Dependency version bump"
];
const deployDependencies = [
  "an undocumented queue consumer",
  "legacy config stored outside version control",
  "a replica lag pattern nobody rehearsed",
  "client retries tuned by folklore",
  "a migration script written for last quarter's schema",
  "support tooling that assumes yesterday's state",
  "a partner API with weak timing guarantees",
  "one regional cache that ignores the announcement",
  "a batch worker still running the old contract",
  "a metrics job that flatters the release"
];
const deployNotes = [
  "Looks small in Git and large in consequences.",
  "Safe if the old assumptions are still alive.",
  "Rollback exists, but dignity may not.",
  "Technically reversible. Socially complicated.",
  "Routine until the forgotten consumer arrives.",
  "Fast path is fine. Slow path is where incidents live.",
  "Good change. Bad timing. Worse dependencies.",
  "This diff trusts a world the logs keep refuting.",
  "Release note says minor; coordination cost says otherwise.",
  "Healthy if no one refreshes the wrong screen twice."
];
const deployContainments = [
  "pause the worker pool and drain writes deliberately",
  "limit the rollout to one region and watch product truth",
  "freeze retries before they amplify the bad assumption",
  "serve stale data intentionally while restoring correctness",
  "revert the config and keep the diagnostic logging",
  "shift traffic back before the queue becomes historical evidence",
  "disable the dependent feature rather than the whole service",
  "contain the tenant triggering worst-case behavior",
  "suspend background work until the interactive path stabilizes",
  "route around the new path while validating cleanup"
];

const runbookSymptoms = [
  "Queue age is rising faster than worker throughput",
  "Customers report stale data after a healthy deploy",
  "Admin search returns contradictory results",
  "Background retries are outnumbering fresh requests",
  "The status page is green while support is not",
  "A rollout completed but behavior is older than the code",
  "One tenant experiences timeouts after every cache refill",
  "Backfill traffic is competing with user work",
  "Replica reads disagree with write-path expectations",
  "Alert volume dropped even though customer pain increased"
];
const runbookFirstSteps = [
  "verify the user-visible path before component dashboards",
  "pause non-critical background traffic",
  "inspect queue age, not just queue length",
  "confirm which deploy actually owns the failing behavior",
  "reproduce one customer journey end to end",
  "compare current config against last known good state",
  "check retries, backoff, and hidden fan-out",
  "establish whether the issue is correctness or reachability",
  "identify the first service that knows something is wrong",
  "capture evidence before the automatic cleanup path rewrites it"
];
const runbookSecondSteps = [
  "sample real payloads from the affected path",
  "pinpoint whether freshness or availability is degrading trust",
  "reduce concurrency before adding more workers",
  "drain the oldest backlog slice first",
  "disable one fallback that keeps muddying the signal",
  "diff the recent deploy against the dependent job contract",
  "isolate one tenant and one region for faster truth",
  "page the owner of the shared state boundary",
  "measure recovery in business units rather than infrastructure units",
  "set a rollback threshold that acknowledges product pain"
];
const runbookTraps = [
  "restarting everything and erasing the only evidence",
  "trusting averages while long-tail failures compound",
  "assuming green health checks imply usable behavior",
  "adding more retries to a saturated dependency",
  "opening a meeting before capturing one clean timeline",
  "treating stale data as a cosmetic defect",
  "optimizing the dashboard before stabilizing the path",
  "rolling forward into a dependency nobody has verified",
  "fixing one component while queue age keeps worsening",
  "declaring mitigation based on component uptime"
];
const runbookExits = [
  "customer-visible correctness is restored and backlog is shrinking",
  "the queue is draining faster than new failure enters",
  "one clean end-to-end test passes on live-like data",
  "support confirms the original complaint stopped reproducing",
  "rollback or mitigation is stable for one business cycle",
  "fresh data is visible where stale state previously dominated",
  "the incident timeline is coherent enough to hand off safely",
  "operators can explain the current state without euphemism",
  "error volume and business pain are both trending down",
  "the system is boring again for the right reasons"
];

const latencySuspected = [
  "database pressure",
  "network flakiness",
  "cache churn",
  "noisy neighbors",
  "GC pauses",
  "cold starts",
  "replica lag",
  "third-party slowness",
  "over-aggressive tracing",
  "one expensive query"
];
const latencyActual = [
  "retry storms on an already slow downstream",
  "background work sharing the critical connection pool",
  "an optimistic timeout tuned against last month's traffic",
  "serial calls hidden behind a parallel-looking abstraction",
  "overly defensive validation on the hot path",
  "queue handoffs that multiplied under load",
  "cache misses synchronized by the deploy",
  "one tenant's batch job occupying the happy path",
  "instrumentation expensive enough to become the incident",
  "a fallback call path nobody profiled with real data"
];
const latencyMitigations = [
  "shed background traffic and preserve interactive work",
  "cap retries by dependency health instead of hope",
  "serve stale but honest results while draining pressure",
  "lower concurrency where contention is amplifying delay",
  "short-circuit one non-essential enrichment call",
  "disable the feature path generating coordinated misses",
  "promote cached defaults while the source system recovers",
  "move one tenant off the shared hot path temporarily",
  "defer trace-heavy instrumentation until after recovery",
  "precompute the expensive slice before the next burst"
];
const latencyGraphs = [
  "a clean upward staircase",
  "a sharp sawtooth with false recoveries",
  "a flat average hiding ugly tail pain",
  "a regional cliff with polite platform metrics",
  "a widening tail with steady medians",
  "an occasional spike that became a personality",
  "a smooth line until user traffic arrived",
  "a graph that looked solved from far away",
  "a rolling wave synchronized with batch windows",
  "a recovery curve that kept restarting"
];
const latencyStories = [
  "checkout users refreshed into duplicate state",
  "support agents saw stale records before customers did",
  "admins waited long enough to click twice and worsen the queue",
  "mobile clients retried faster than the backend could breathe",
  "ops dashboards loaded before the product did",
  "search felt alive while results were old enough to be fiction",
  "export jobs worked eventually and still broke trust",
  "API clients stayed connected while SLAs quietly expired",
  "customer sessions remained intact and outcomes did not",
  "one premium tenant experienced the full truth first"
];

const oncallReasons = [
  "Queue backlog page",
  "Replica freshness page",
  "Search correctness page",
  "Model gateway confidence page",
  "Billing retry saturation page",
  "Partner webhook drift page",
  "Feature flag regression page",
  "Cache stampede page",
  "Background worker lockup page",
  "Status page contradiction page"
];
const oncallMoods = [
  "controlled irritation",
  "professional disbelief",
  "measured resignation",
  "focused suspicion",
  "operational bitterness",
  "calm until the third contradiction",
  "sleep-deprived pattern recognition",
  "tight-lipped optimism",
  "high-context annoyance",
  "acceptance with logging"
];
const oncallPaths = [
  "started with dashboards and ended with one truthful customer trace",
  "crossed three teams before reaching the only real owner",
  "looked like infra until product behavior forced a different story",
  "spent too long in health checks before entering business state",
  "proved the fallback existed and the outcome did not",
  "moved from queue depth to queue age to actual evidence",
  "began as a deploy question and ended as a coordination failure",
  "found the root cause in the job nobody mentioned during handoff",
  "required comparing what logs said with what support knew",
  "only made sense after ignoring one very confident dashboard"
];
const oncallResolutions = [
  "paused the offending background work and restored product truth",
  "rolled back the feature path and drained the side effects manually",
  "reduced concurrency until the downstream dependency could recover",
  "switched to the boring code path and kept it there",
  "replayed the broken slice with better guards around freshness",
  "disabled one helpful-looking enrichment step that was ruining latency",
  "reassigned traffic away from the region doing theater",
  "bound the retries and let the system stop hurting itself",
  "served stale data explicitly instead of accidentally",
  "asked the right owner the question nobody had framed correctly"
];
const oncallScars = [
  "every queue metric now needs an age graph beside it",
  "handoffs got shorter and more specific after this",
  "the team no longer trusts partial availability without business checks",
  "one hidden dependency is now part of every deploy review",
  "status language became less poetic and more useful",
  "fallback paths are treated like product features now",
  "the alerting posture learned to care about customer truth",
  "someone finally documented the job that always mattered",
  "runbooks lost one superstition and gained one test",
  "the next incident will start with better questions"
];

const migrationSources = [
  "legacy cron fleet",
  "homegrown deployment scripts",
  "single-region postgres",
  "manually curated dashboards",
  "inline feature flag config",
  "shared background worker pool",
  "old auth gateway",
  "support-owned CSV workflow",
  "direct S3 polling",
  "ad hoc model routing rules"
];
const migrationTargets = [
  "scheduled container jobs",
  "managed rollout tooling",
  "partitioned primary storage",
  "product-aware observability",
  "centralized flag service",
  "isolated worker queues",
  "identity proxy layer",
  "self-serve import tooling",
  "evented object notifications",
  "policy-driven routing config"
];
const migrationStyles = [
  "big-bang cutover",
  "dual writes with staged reads",
  "shadow traffic and compare",
  "slice by tenant",
  "freeze and replay",
  "region-by-region migration",
  "feature-flagged cutover",
  "backfill first and swap later",
  "parallel run with operator approval",
  "manual pilot before automation"
];
const migrationCosts = [
  "state reconciliation nobody budgeted",
  "operator attention during every strange edge case",
  "weeks of dual-path observability cleanup",
  "retraining teams on where truth now lives",
  "temporary latency from maintaining both worlds",
  "backfill capacity fighting production traffic",
  "contract drift between new and old clients",
  "a rollback story uglier than the kickoff slide",
  "support confusion around mixed-state behavior",
  "audit gaps during the handoff period"
];
const migrationSafePaths = [
  "move one tenant cohort at a time with replayable evidence",
  "keep the old path readable until the new one proves correctness",
  "gate the cutover on product outcomes, not component checks",
  "write the cleanup tooling before the pilot begins",
  "preserve rollback data shape until the backlog is clear",
  "separate backfill traffic from customer-facing capacity",
  "document manual intervention before anyone needs it",
  "ship the observability first and the migration second",
  "treat dual writes as a temporary tax with an end date",
  "force ownership on every boundary before touching state"
];

const reviewFeedback = [
  "Can we simplify this before merging?",
  "I think we need a test for this path.",
  "This feels riskier than the diff suggests.",
  "Could we scope this change more tightly?",
  "I am not convinced this helper belongs here.",
  "What happens on the failure path?",
  "Do we need this abstraction yet?",
  "This is cleaner, but I am worried about behavior.",
  "Can we keep the existing contract for now?",
  "I need more context on why this changed."
];
const reviewSubtext = [
  "I see a future incident and would like not to attend it.",
  "The code is plausible but the edge cases feel homeless.",
  "This diff solved a local discomfort by exporting risk.",
  "The refactor is elegant in a way production usually dislikes.",
  "You moved faster than the ownership map supports.",
  "I believe the happy path and distrust the rest.",
  "The abstraction is better for authors than operators.",
  "This probably works and I still do not want to bet on it.",
  "The contract change is bigger than the summary admits.",
  "I need the historical reason before I sign away the risk."
];
const reviewActions = [
  "add one regression test tied to user behavior",
  "split the cleanup from the behavior change",
  "document the old assumption before replacing it",
  "pull one dependency out of the hot path",
  "prove the fallback with an explicit test",
  "restore the contract and stage the rest later",
  "narrow the diff until the review surface matches the summary",
  "capture before-and-after metrics for the risky path",
  "ask the owning team for explicit signoff",
  "reduce the abstraction and keep the evidence"
];

const complianceAreas = [
  "Access review",
  "Change management",
  "Backup verification",
  "Vendor oversight",
  "Incident response evidence",
  "Key rotation",
  "Privilege separation",
  "Data retention",
  "Recovery testing",
  "Audit logging"
];
const complianceTruths = [
  "one diligent operator still closes the loop manually",
  "evidence exists because someone remembers where it lives",
  "the control is reliable only when traffic is ordinary",
  "the process works because the same people have not left yet",
  "automation covers most of the path and none of the weird cases",
  "screenshots still do more work than the platform wants to admit",
  "the review cadence is real and the enforcement remains social",
  "the system is compliant by habit more than by design",
  "a compensating spreadsheet absorbs the missing product feature",
  "the audit story is cleaner than the operational one"
];
const complianceControls = [
  "a weekly evidence sweep with named owners",
  "a forced approval step in the deploy path",
  "signed backup restore drills with follow-up dates",
  "documented exceptions reviewed on a fixed cadence",
  "log retention tied to specific investigation flows",
  "break-glass usage with mandatory narrative fields",
  "quarterly access snapshots tied to team rosters",
  "segregated duties around the dangerous manual step",
  "automation that blocks the easiest unsafe move",
  "plain-language runbooks for the controls that still need people"
];
const complianceComments = [
  "The control passes best when nobody tries to be clever.",
  "We survive audits by being more organized than magical.",
  "This is stable until ownership churns.",
  "The evidence path is real and still too person-shaped.",
  "The manual step is annoying and therefore memorable.",
  "We should automate this before it becomes legend.",
  "The auditors like it more than the operators do.",
  "This works because the team respects the boring parts.",
  "The posture is stronger than the product defaults suggest.",
  "No one loves this control, which is part of why it functions."
];

const roadmapPromises = [
  "unified internal tooling",
  "self-serve customer reporting",
  "agent-assisted support workflows",
  "faster enterprise onboarding",
  "real-time billing visibility",
  "cross-region failover confidence",
  "simpler integration setup",
  "automated compliance evidence",
  "smarter deployment safety",
  "platform standardization"
];
const roadmapDependencies = [
  "a queue ownership rewrite",
  "the auth migration finishing honestly",
  "a search indexing strategy that survives traffic",
  "supporting data freshness as a product requirement",
  "one neglected internal API getting a real owner",
  "a staffing plan nobody has signed yet",
  "deleting three legacy paths first",
  "budget surviving the next planning round",
  "one partner integration becoming predictable",
  "the platform team admitting what they will not build"
];
const roadmapTruths = [
  "the promise is real and the date is fiction",
  "the dependency is bigger than the launch slide suggests",
  "everyone wants the outcome and fewer people own the hard part",
  "the item exists because adjacent pain became politically visible",
  "this stays green on the roadmap by borrowing confidence from another team",
  "the core work is operational and the pitch remains strategic",
  "the plan needs one unglamorous quarter before it earns momentum",
  "scope will shrink the moment delivery gets specific",
  "the initiative is useful and the naming is compensatory",
  "execution depends on deleting complexity that still has defenders"
];
const roadmapHedges = [
  "timing remains aligned to dependency readiness",
  "we will phase delivery according to validated learning",
  "scope will prioritize the highest-confidence path first",
  "the milestone is dependent on cross-functional execution",
  "we are sequencing rollout to protect reliability",
  "the team is validating assumptions before wider release",
  "delivery will follow operational readiness gates",
  "initial support will target a controlled audience",
  "we are narrowing the first release to the durable slice",
  "the roadmap will adapt based on implementation findings"
];

const meetingTypes = [
  "Architecture review",
  "Launch readiness",
  "Incident retro",
  "Weekly sync",
  "Roadmap triage",
  "Cross-team alignment",
  "Dependency review",
  "Metrics deep dive",
  "Risk checkpoint",
  "Operating review"
];
const meetingStatedGoals = [
  "confirm the plan",
  "align on owners",
  "review metrics",
  "surface risks",
  "finalize scope",
  "share progress",
  "evaluate options",
  "unblock execution",
  "capture decisions",
  "improve reliability"
];
const meetingActualGoals = [
  "obtain distributed permission",
  "discover who is quietly worried",
  "relitigate one earlier decision",
  "turn ambiguity into manageable notes",
  "move blame into future tense",
  "hear the same risk from a more senior mouth",
  "protect a date without owning the cost",
  "find the missing dependency owner",
  "translate discomfort into action items",
  "buy another week of coordinated optimism"
];
const meetingOutputs = [
  "a document with stronger verbs and the same uncertainty",
  "three follow-up threads and one real decision",
  "a parking lot that became the actual work",
  "one owner assignment everyone believed for six hours",
  "a cleaner summary than the current reality deserves",
  "an action list with one item that matters",
  "an agreement to gather evidence before the next meeting",
  "a renamed risk to make escalation socially acceptable",
  "more context and fewer illusions about timing",
  "notes that future operators will mine for intent"
];

const ticketRequests = [
  "Add a CSV export",
  "Expose one more search filter",
  "Backfill missing customer records",
  "Support a new webhook variant",
  "Rename the status labels",
  "Auto-close stale tasks",
  "Improve deployment notifications",
  "Speed up admin search",
  "Add retry visibility",
  "Update the auth flow copy"
];
const ticketHiddenWork = [
  "a contract cleanup across three services",
  "manual reconciliation for old inconsistent data",
  "state migration with backward compatibility baggage",
  "coordination with a team that believes they are not involved",
  "product decisions the ticket politely avoids naming",
  "performance work hiding inside a UX request",
  "audit implications nobody budgeted for",
  "support tooling changes beyond the UI diff",
  "retry semantics that affect every unhappy path",
  "ownership questions older than the sprint board"
];
const ticketStatuses = [
  "waiting on a decision disguised as implementation",
  "blocked by a dependency with no natural owner",
  "technically started and socially unresolved",
  "ready once we admit the scope honestly",
  "in progress if you count archaeological work",
  "paused until the product question stops shape-shifting",
  "done for the happy path and dangerous for the rest",
  "queued behind work that shares the same hidden root cause",
  "awaiting confirmation from the only person who remembers why",
  "stable enough to demo and not enough to trust"
];
const ticketResponses = [
  "We can do the visible part quickly and the real part deliberately.",
  "This is small in UI surface and medium in system consequence.",
  "We should split the request before pretending it fits one ticket.",
  "The ticket is reasonable; the surrounding reality is not.",
  "This depends on a decision the description currently hides.",
  "We can estimate after we identify which contract is actually moving.",
  "It is actionable once ownership is stated more honestly.",
  "The fastest path is possible and will not be the prettiest path.",
  "Support for this exists until edge cases enter the room.",
  "The request is valid and the deadline would like a different system."
];

const platformOfferings = [
  "Golden path deployment platform",
  "Unified configuration portal",
  "Internal data access layer",
  "Model routing control plane",
  "Workflow template platform",
  "Developer productivity dashboard",
  "Shared background job framework",
  "Observability command center",
  "Self-serve integration hub",
  "Policy-driven release gate"
];
const platformJobs = [
  "standardizing one repeated workflow",
  "moving YAML edits behind a prettier screen",
  "centralizing ownership that never really centralized",
  "making common tasks feel like product offerings",
  "reducing one team's repetitive support burden",
  "coordinating deploy choices already visible in Git",
  "wrapping an old script with better posture",
  "enforcing defaults other teams did not ask for",
  "providing a narrative for infra investment",
  "keeping cross-team decisions out of chat"
];
const platformCosts = [
  "a permanent support lane for edge cases nobody budgeted",
  "maintainers becoming the human abstraction boundary",
  "slow adoption hidden behind mandatory migration language",
  "feature backlog pressure from every special case",
  "one team absorbing the operational complexity of many",
  "an ever-growing exception model in the name of standardization",
  "long-lived compatibility promises to products that will not converge",
  "more docs, more meetings, and the same shared state",
  "careful diplomacy around teams that prefer autonomy",
  "platform tax paid in every roadmap quarter"
];
const platformRetirements = [
  "fold the narrow useful slice into product defaults",
  "delete the optional abstractions and keep the safety rails",
  "graduate the healthy patterns and archive the ceremony",
  "reduce the scope until ownership matches headcount",
  "merge the control surface into the deploy path it already shadows",
  "turn exceptions into explicit contracts and remove the rest",
  "stop calling it a platform once it becomes one workflow",
  "retire the dashboard layer that only explains the dashboard layer",
  "move the value into tooling and remove the theater",
  "end the platform project before it needs a brand refresh"
];

const generators: Record<string, EntryGenerator> = {
  architecture(index) {
    const { a, b, c } = digits(index);
    const platform = platforms[a];
    const workload = workloads[b];
    const motive = architectureMotives[c];
    const fix = boringFixes[(a + b) % boringFixes.length];
    const severity = SEVERITY_SCALE[(a + b + c) % SEVERITY_SCALE.length];
    const title = `${platform} for ${workload}`;
    const summary = `${platform} deployed for ${workload} because ${motive.toLowerCase()}.`;

    return {
      ...baseEntry("architecture", index, "dry", title, summary, makeTags("architecture", platform, workload, motive)),
      verdict: `${titleCase(workload)} did not ask for ${platform.toLowerCase()}.`,
      severity,
      why_it_happens: `${motive.charAt(0).toUpperCase() + motive.slice(1)} and turned a bounded requirement into a platform program.`,
      recommended_fix: `Use ${fix} and remove the ceremonial layers before they become policy.`
    };
  },
  incident(index) {
    const { a, b, c } = digits(index);
    const line = incidentLines[a];
    const context = incidentContexts[b];
    const truth = incidentTruths[c];
    const useCase = incidentUse[(a + c) % incidentUse.length];
    const failCase = incidentFails[(b + c) % incidentFails.length];
    const credibility = Number(
      (0.41 + ((a * 13 + b * 7 + c * 3) % 46) / 100).toFixed(2)
    );
    const title = `${line} during ${context}`;
    const summary =
      `${line}, which was useful only if you cared more about dashboards than outcomes.`;

    return {
      ...baseEntry("incident", index, "operational", title, summary, makeTags("incident", line, context)),
      excuse: `${line}, but ${truth.toLowerCase()}.`,
      translation: truth,
      delivery_context: context,
      credibility,
      when_to_use: `Use when ${useCase.toLowerCase()}.`,
      when_it_fails: `It fails the moment ${failCase.toLowerCase()}.`
    };
  },
  agent(index) {
    const { a, b, c } = digits(index);
    const type = agentTypes[a];
    const scope = agentScopes[b];
    const risk = agentRisks[c];
    const secondRisk = agentRisks[(a + c + 3) % agentRisks.length];
    const strength = agentStrengths[a];
    const secondStrength = agentStrengths[(b + c + 2) % agentStrengths.length];
    const reliabilityScore = Math.max(
      36,
      Math.min(95, 44 + a * 4 + b * 2 - c)
    );
    const performanceRating =
      reliabilityScore >= 78
        ? PERFORMANCE[2]
        : reliabilityScore >= 58
          ? PERFORMANCE[1]
          : PERFORMANCE[0];
    const hallucinationRisk = SIMPLE_SCALE[(a + c) % SIMPLE_SCALE.length];
    const escalationReadiness = SIMPLE_SCALE[(a * 2 + b + c) % SIMPLE_SCALE.length];
    const promotionReadiness =
      reliabilityScore >= 78 && escalationReadiness !== "low"
        ? PROMOTION[1]
        : reliabilityScore <= 50
          ? PROMOTION[0]
          : PROMOTION[2];
    const managerNote = agentManagers[(a + b + c) % agentManagers.length];
    const title = `${type} for ${scope}`;
    const summary = `${type} moves quickly through ${scope} and still treats production nuance as optional reading.`;

    return {
      ...baseEntry("agent", index, "fake-hr", title, summary, makeTags("agent", type, scope)),
      performance_rating: performanceRating,
      reliability_score: reliabilityScore,
      hallucination_risk: hallucinationRisk,
      escalation_readiness: escalationReadiness,
      strengths: [
        `${titleCase(strength)} under bounded context.`,
        `${titleCase(secondStrength)} when the task shape is legible.`
      ],
      improvement_areas: [
        `${risk.charAt(0).toUpperCase() + risk.slice(1)}.`,
        `${secondRisk.charAt(0).toUpperCase() + secondRisk.slice(1)}.`
      ],
      promotion_readiness: promotionReadiness,
      manager_note: managerNote
    };
  },
  decision(index) {
    const { a, b, c } = digits(index);
    const pair = decisionPairs[a];
    const scenario = decisionScenarios[b];
    const constraint = decisionConstraints[c];
    const reconsider = decisionReconsider[(a + b + c) % decisionReconsider.length];
    const answer = pair.recommended === "left" ? pair.left : pair.right;
    const antiPattern = pair.recommended === "left" ? pair.right : pair.left;
    const confidence = Number(
      (0.68 + ((a + b + c) % 25) / 100).toFixed(2)
    );
    const title = `${pair.left} vs ${pair.right} for ${scenario}`;
    const summary = `${scenario.charAt(0).toUpperCase() + scenario.slice(1)} rarely benefits from choosing the more theatrical option.`;

    return {
      ...baseEntry("decision", index, "opinionated", title, summary, makeTags("decision", pair.left, pair.right, scenario)),
      question: `Should ${scenario} use ${pair.left} or ${pair.right}?`,
      answer,
      confidence,
      reason: `${scenario.charAt(0).toUpperCase() + scenario.slice(1)} is constrained by ${constraint.toLowerCase()}, so ${answer} adds less coordination tax.`,
      anti_pattern: `Choosing ${antiPattern} so the review feels more future-proof than the workload actually is.`,
      when_to_reconsider: `Reconsider when ${reconsider.toLowerCase()}.`
    };
  },
  postmortem(index) {
    const { a, b, c } = digits(index);
    const pattern = postmortemPatterns[a];
    const trigger = postmortemTriggers[b];
    const impact = postmortemImpacts[c];
    const cause = postmortemCauses[(a + b) % postmortemCauses.length];
    const lesson = postmortemLessons[(b + c) % postmortemLessons.length];
    const action = postmortemActions[(a + c) % postmortemActions.length];
    const title = `Postmortem: ${pattern} after ${trigger}`;
    const summary = `${pattern.charAt(0).toUpperCase() + pattern.slice(1)} surfaced after ${trigger.toLowerCase()} and exposed a more honest dependency map than the docs had.`;

    return {
      ...baseEntry("postmortem", index, "postmortem", title, summary, makeTags("postmortem", pattern, trigger)),
      failure_pattern: `${pattern} after ${trigger.toLowerCase()}`,
      customer_impact: impact,
      root_cause: cause,
      lesson: `${lesson.charAt(0).toUpperCase() + lesson.slice(1)}.`,
      corrective_action: `${action.charAt(0).toUpperCase() + action.slice(1)}.`
    };
  },
  severity(index) {
    const { a, b, c } = digits(index);
    const phrase = severityPhrases[a];
    const translation = severityTruths[b];
    const blastRadius = severityBlasts[c];
    const escalationLevel = SEVERITY_SCALE[(a + b + c) % SEVERITY_SCALE.length];
    const recommendedMessage =
      severityMessages[(a + b) % severityMessages.length];
    const title = `${phrase} translator`;
    const summary = `${phrase.charAt(0).toUpperCase() + phrase.slice(1)} usually means ${translation.toLowerCase()} across ${blastRadius.toLowerCase()}.`;

    return {
      ...baseEntry("severity", index, "plain-truth", title, summary, makeTags("severity", phrase, blastRadius)),
      phrase,
      translation,
      escalation_level: escalationLevel,
      blast_radius: blastRadius,
      recommended_message: recommendedMessage
    };
  },
  token(index) {
    const { a, b, c } = digits(index);
    const activity = tokenActivities[a];
    const waste = tokenWaste[b];
    const betterUse = tokenBetterUses[c];
    const financeNote = tokenFinance[(a + b) % tokenFinance.length];
    const tokenSpend = 18000 + a * 150000 + b * 11000 + c * 1700;
    const guiltLevel = SEVERITY_SCALE[(a + b + c) % SEVERITY_SCALE.length];
    const title = `${activity} spent ${tokenSpend.toLocaleString()} tokens`;
    const summary = `${activity} converted real budget into ${waste.toLowerCase()}.`;

    return {
      ...baseEntry("token", index, "meta", title, summary, makeTags("token", activity, waste)),
      token_spend: tokenSpend,
      waste_pattern: waste,
      guilt_level: guiltLevel,
      better_use: `${betterUse.charAt(0).toUpperCase() + betterUse.slice(1)}.`,
      finance_note: financeNote
    };
  },
  startup(index) {
    const { a, b, c } = digits(index);
    const idea = startupIdeas[a];
    const buyer = startupBuyers[b];
    const moat = startupMoats[c];
    const risk = startupRisks[(a + b) % startupRisks.length];
    const investorReaction =
      startupInvestor[(b + c) % startupInvestor.length];
    const title = `${idea} for ${buyer}`;
    const summary = `${idea} packaged for ${buyer.toLowerCase()} with just enough AI posture to sound fundable.`;

    return {
      ...baseEntry("startup", index, "venture", title, summary, makeTags("startup", idea, buyer)),
      pitch: `${idea} for ${buyer}.`,
      buyer,
      moat,
      risk,
      investor_reaction: investorReaction
    };
  },
  observability(index) {
    const { a, b, c } = digits(index);
    const signal = observabilitySignals[a];
    const falseSignal = observabilityFalseSignals[b];
    const actualProblem = observabilityProblems[c];
    const nextMove = observabilityMoves[(a + b) % observabilityMoves.length];
    const confidenceGap =
      observabilityGaps[(b + c) % observabilityGaps.length];
    const title = `${signal} hid ${actualProblem}`;
    const summary = `${signal} looked informative while ${actualProblem.toLowerCase()}.`;

    return {
      ...baseEntry("observability", index, "diagnostic", title, summary, makeTags("observability", signal, actualProblem)),
      signal,
      false_signal: falseSignal,
      actual_problem: actualProblem,
      next_move: `${nextMove.charAt(0).toUpperCase() + nextMove.slice(1)}.`,
      confidence_gap: confidenceGap
    };
  },
  deploy(index) {
    const { a, b, c } = digits(index);
    const releaseType = deployTypes[a];
    const hiddenDependency = deployDependencies[b];
    const operatorNote = deployNotes[c];
    const containment = deployContainments[(a + b) % deployContainments.length];
    const rollbackRisk = SEVERITY_SCALE[(a + c) % SEVERITY_SCALE.length];
    const title = `${releaseType} with ${hiddenDependency}`;
    const summary = `${releaseType} looked routine until ${hiddenDependency.toLowerCase()} reminded everyone who really owned the pager.`;

    return {
      ...baseEntry("deploy", index, "release", title, summary, makeTags("deploy", releaseType, hiddenDependency)),
      release_type: releaseType,
      rollback_risk: rollbackRisk,
      hidden_dependency: hiddenDependency,
      operator_note: operatorNote,
      containment: `${containment.charAt(0).toUpperCase() + containment.slice(1)}.`
    };
  },
  runbook(index) {
    const { a, b, c } = digits(index);
    const symptom = runbookSymptoms[a];
    const firstStep = runbookFirstSteps[b];
    const secondStep = runbookSecondSteps[c];
    const trap = runbookTraps[(a + b) % runbookTraps.length];
    const exitCondition = runbookExits[(b + c) % runbookExits.length];
    const title = `${symptom} runbook`;
    const summary = `${symptom} gets easier once the runbook admits which steps are ceremony and which ones change reality.`;

    return {
      ...baseEntry("runbook", index, "procedural", title, summary, makeTags("runbook", symptom)),
      symptom,
      first_step: `${firstStep.charAt(0).toUpperCase() + firstStep.slice(1)}.`,
      second_step: `${secondStep.charAt(0).toUpperCase() + secondStep.slice(1)}.`,
      trap: `${trap.charAt(0).toUpperCase() + trap.slice(1)}.`,
      exit_condition: `${exitCondition.charAt(0).toUpperCase() + exitCondition.slice(1)}.`
    };
  },
  latency(index) {
    const { a, b, c } = digits(index);
    const suspectedCause = latencySuspected[a];
    const actualCause = latencyActual[b];
    const mitigation = latencyMitigations[c];
    const graphShape = latencyGraphs[(a + b) % latencyGraphs.length];
    const customerStory = latencyStories[(b + c) % latencyStories.length];
    const title = `${graphShape} from ${actualCause}`;
    const summary = `${graphShape.charAt(0).toUpperCase() + graphShape.slice(1)} convinced everyone it was ${suspectedCause.toLowerCase()} until the traces and customer complaints converged.`;

    return {
      ...baseEntry("latency", index, "weary", title, summary, makeTags("latency", suspectedCause, actualCause)),
      suspected_cause: suspectedCause,
      actual_cause: actualCause,
      mitigation: `${mitigation.charAt(0).toUpperCase() + mitigation.slice(1)}.`,
      graph_shape: graphShape,
      customer_story: `${customerStory.charAt(0).toUpperCase() + customerStory.slice(1)}.`
    };
  },
  oncall(index) {
    const { a, b, c } = digits(index);
    const pageReason = oncallReasons[a];
    const operatorMood = oncallMoods[b];
    const investigationPath = oncallPaths[c];
    const resolution = oncallResolutions[(a + b) % oncallResolutions.length];
    const scarTissue = oncallScars[(b + c) % oncallScars.length];
    const title = `${pageReason}`;
    const summary = `${pageReason} turned a normal shift into ${operatorMood.toLowerCase()} and a search for facts that were technically available but emotionally hidden.`;

    return {
      ...baseEntry("oncall", index, "oncall", title, summary, makeTags("oncall", pageReason, operatorMood)),
      page_reason: pageReason,
      operator_mood: operatorMood,
      investigation_path: `${investigationPath.charAt(0).toUpperCase() + investigationPath.slice(1)}.`,
      resolution: `${resolution.charAt(0).toUpperCase() + resolution.slice(1)}.`,
      scar_tissue: `${scarTissue.charAt(0).toUpperCase() + scarTissue.slice(1)}.`
    };
  },
  migration(index) {
    const { a, b, c } = digits(index);
    const source = migrationSources[a];
    const target = migrationTargets[b];
    const migrationStyle = migrationStyles[c];
    const hiddenCost = migrationCosts[(a + b) % migrationCosts.length];
    const safestPath = migrationSafePaths[(b + c) % migrationSafePaths.length];
    const title = `${source} to ${target}`;
    const summary = `${source.charAt(0).toUpperCase() + source.slice(1)} to ${target.toLowerCase()} sounds cleaner in the planning deck than in the week where dual writes start lying.`;

    return {
      ...baseEntry("migration", index, "transitional", title, summary, makeTags("migration", source, target)),
      source,
      target,
      migration_style: migrationStyle,
      hidden_cost: hiddenCost,
      safest_path: `${safestPath.charAt(0).toUpperCase() + safestPath.slice(1)}.`
    };
  },
  review(index) {
    const { a, b, c } = digits(index);
    const feedback = reviewFeedback[a];
    const subtext = reviewSubtext[b];
    const action = reviewActions[c];
    const severity = SEVERITY_SCALE[(a + b + c) % SEVERITY_SCALE.length];
    const mergeability = MERGEABILITY[(a + b) % MERGEABILITY.length];
    const title = `${feedback} review`;
    const summary = `${feedback} is rarely about the line it points at.`;

    return {
      ...baseEntry("review", index, "reviewer", title, summary, makeTags("review", feedback, mergeability)),
      feedback,
      subtext,
      severity,
      action: `${action.charAt(0).toUpperCase() + action.slice(1)}.`,
      mergeability
    };
  },
  compliance(index) {
    const { a, b, c } = digits(index);
    const controlArea = complianceAreas[a];
    const plainTruth = complianceTruths[b];
    const compensatingControl = complianceControls[c];
    const operatorComment =
      complianceComments[(a + b) % complianceComments.length];
    const auditability = SIMPLE_SCALE[(a + b + c) % SIMPLE_SCALE.length];
    const title = `${controlArea} control`;
    const summary = `${controlArea} reads cleanest when nobody asks which manual step still holds the whole posture together.`;

    return {
      ...baseEntry("compliance", index, "bureaucratic", title, summary, makeTags("compliance", controlArea)),
      control_area: controlArea,
      plain_truth: plainTruth,
      auditability,
      compensating_control: `${compensatingControl.charAt(0).toUpperCase() + compensatingControl.slice(1)}.`,
      operator_comment: operatorComment
    };
  },
  roadmap(index) {
    const { a, b, c } = digits(index);
    const promise = roadmapPromises[a];
    const dependency = roadmapDependencies[b];
    const truth = roadmapTruths[c];
    const hedge = roadmapHedges[(a + b) % roadmapHedges.length];
    const deliveryRisk = SEVERITY_SCALE[(a + b + c) % SEVERITY_SCALE.length];
    const title = `${promise} roadmap`;
    const summary = `${promise.charAt(0).toUpperCase() + promise.slice(1)} remains a slide until ${dependency.toLowerCase()} stops pretending it is already solved.`;

    return {
      ...baseEntry("roadmap", index, "roadmap", title, summary, makeTags("roadmap", promise, dependency)),
      promise,
      actual_dependency: dependency,
      delivery_risk: deliveryRisk,
      truth,
      hedge
    };
  },
  meeting(index) {
    const { a, b, c } = digits(index);
    const meetingType = meetingTypes[a];
    const statedGoal = meetingStatedGoals[b];
    const actualGoal = meetingActualGoals[c];
    const output = meetingOutputs[(a + b) % meetingOutputs.length];
    const survivability = SIMPLE_SCALE[(a + b + c) % SIMPLE_SCALE.length];
    const title = `${meetingType} about ${statedGoal}`;
    const summary = `${meetingType} said it was about ${statedGoal.toLowerCase()} and then became ${actualGoal.toLowerCase()}.`;

    return {
      ...baseEntry("meeting", index, "meeting-room", title, summary, makeTags("meeting", meetingType, statedGoal)),
      meeting_type: meetingType,
      stated_goal: statedGoal,
      actual_goal: actualGoal,
      output,
      survivability
    };
  },
  ticket(index) {
    const { a, b, c } = digits(index);
    const request = ticketRequests[a];
    const hiddenWork = ticketHiddenWork[b];
    const priority = SEVERITY_SCALE[(a + b + c) % SEVERITY_SCALE.length];
    const truthfulStatus = ticketStatuses[c];
    const expectedResponse = ticketResponses[(a + b) % ticketResponses.length];
    const title = `${request} ticket`;
    const summary = `${request} entered the queue wearing a small request costume over ${hiddenWork.toLowerCase()}.`;

    return {
      ...baseEntry("ticket", index, "backlog", title, summary, makeTags("ticket", request, hiddenWork)),
      request,
      hidden_work: hiddenWork,
      priority,
      truthful_status: truthfulStatus,
      expected_response: expectedResponse
    };
  },
  platform(index) {
    const { a, b, c } = digits(index);
    const offering = platformOfferings[a];
    const actualJob = platformJobs[b];
    const teamCost = platformCosts[c];
    const retirementPlan =
      platformRetirements[(a + b) % platformRetirements.length];
    const adoptionRisk = SEVERITY_SCALE[(a + b + c) % SEVERITY_SCALE.length];
    const title = `${offering} for ${actualJob}`;
    const summary = `${offering} exists because ${actualJob.toLowerCase()} looked more dignified as a platform problem.`;

    return {
      ...baseEntry("platform", index, "platform", title, summary, makeTags("platform", offering, actualJob)),
      offering,
      actual_job: actualJob,
      adoption_risk: adoptionRisk,
      team_cost: teamCost,
      retirement_plan: retirementPlan
    };
  }
};

await resetDirectory(CONTENT_DIR);

for (const category of CATEGORY_CONFIGS) {
  const generator = generators[category.id];

  if (!generator) {
    throw new Error(`Missing generator for category "${category.id}".`);
  }

  const entries = Array.from({ length: ENTRY_COUNT_PER_CATEGORY }, (_, index) =>
    generator(index)
  );

  const firstEntry = entries[0];

  if (!firstEntry || firstEntry.id !== category.sampleId) {
    throw new Error(
      `Generator for "${category.id}" did not produce the expected sample id "${category.sampleId}".`
    );
  }

  await writeJson(
    path.join(CONTENT_DIR, category.id, "catalog.generated.json"),
    entries
  );
}

console.log(
  `Generated ${CATEGORY_CONFIGS.length * ENTRY_COUNT_PER_CATEGORY} entries across ${CATEGORY_CONFIGS.length} collections in ${CONTENT_DIR}.`
);
