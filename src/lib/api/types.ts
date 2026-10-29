/**
 * DTOs mirroring DeskPilot's DRF serializers.
 *
 * Hand-written on purpose: the surface is small and stable, and hand-written
 * types stay readable at the call site. If the API grows, generate these from
 * `/api/v1/schema/` instead.
 *
 * A field typed `| null` is genuinely nullable in the API — `cost_usd` is null
 * when the model has no price row, `ai_confidence` is null until the agent has
 * decided. Do not default them to 0 in the UI: a fake zero is worse than a dash.
 */

// -- session ----------------------------------------------------------------
/**
 * DeskPilot's real role ladder (`backend/apps/accounts/models.py`).
 * The ordering is the IT support hierarchy, not alphabetical.
 */
export type Role = "ADMIN" | "SERVICE_DESK" | "TECHNICIAN" | "REQUESTER";

export type User = {
  id: string;
  email: string;
  full_name: string;
  is_email_verified: boolean;
  date_joined: string | null;
  is_active: boolean;
};

/** DeskPilot is single-tenant; the API returns exactly one of these. */
export type Membership = {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: Role;
};

export type MeResponse = {
  user: User;
  memberships: Membership[];
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: User;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]> | null;
    request_id?: string;
  };
};

/** Not every list endpoint returns this yet — see `docs/WEB_INTEGRATION_PLAN.md` D6. */
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  page_size: number;
  results: T[];
};

// -- tickets ----------------------------------------------------------------
export type TicketStatus =
  | "new"
  | "in_progress"
  | "awaiting_agent"
  | "awaiting_user"
  | "resolved"
  | "closed";

export type TicketPriority = "P1" | "P2" | "P3" | "P4";

export type TicketCategory =
  | "hardware"
  | "software"
  | "network"
  | "account"
  | "email"
  | "printer"
  | "other"
  | "";

/**
 * What the *agent* concluded. Deliberately separate from `status`, which is what
 * a human did — conflating the two is how auto-resolution rates get inflated.
 */
export type TicketDisposition =
  | "auto_resolved"
  | "needs_human"
  | "needs_input"
  | "out_of_scope"
  | "escalated"
  | "";

export type Ticket = {
  id: number;
  number: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  ai_disposition: TicketDisposition;
  ai_confidence: number | null;
  created_at: string;
};

export type TicketMessage = {
  id: number;
  author_type: "requester" | "agent" | "human" | "tool";
  author_name: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type TicketDetail = Ticket & {
  body: string;
  requester_name: string;
  requester_email: string;
  device_hostname: string;
  ai_summary: string;
  ai_diagnosis: string;
  messages: TicketMessage[];
  latest_run_id: number | null;
  updated_at: string;
};

export type TicketCreate = {
  subject: string;
  body: string;
  requester_name?: string;
  requester_email?: string;
  device_hostname?: string;
  priority?: TicketPriority;
};

// -- agent runs -------------------------------------------------------------
export type RunStatus =
  | "queued"
  | "running"
  | "finished"
  | "failed"
  | "cancelled"
  | "needs_input"
  | "awaiting_approval";

export type StepStatus = "ok" | "error" | "requires_approval" | "refused";

export type AgentStep = {
  id: number;
  step_no: number;
  thought: string;
  tool_name: string;
  tool_risk: string;
  validated_args: Record<string, unknown>;
  /** `{ok: true, result: {...}}` or `{ok: false, error: "..."}`. */
  result: { ok?: boolean; result?: unknown; error?: string } | null;
  status: StepStatus;
  error_code: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: string | null;
  created_at: string;
};

export type AgentRun = {
  id: number;
  ticket: number;
  status: RunStatus;
  trigger: string;
  model: string;
  prompt_version: string;
  iterations: number;
  tool_calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: string | null;
  duration_ms: number | null;
  final_result: Record<string, unknown> | null;
  pending_question: string;
  error: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  steps: AgentStep[];
};

/** Short-lived, single-run token for the trace socket. Never the session token. */
export type WsTicket = {
  ticket: string;
  run: number;
  expires_in: number;
};

export type RunSummary = Pick<
  AgentRun,
  "id" | "ticket" | "status" | "iterations" | "tool_calls" | "cost_usd" | "duration_ms" | "error" | "created_at"
>;

// -- approvals --------------------------------------------------------------
export type RiskClass = "READ" | "WRITE_REVERSIBLE" | "WRITE_DESTRUCTIVE";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "consumed";

export type ApprovalRequest = {
  id: number;
  run: number;
  step_no: number | null;
  tool_name: string;
  risk_class: RiskClass;
  args_redacted: Record<string, unknown>;
  /** Binds the approval to these exact arguments — approving one set cannot run another. */
  args_hash: string;
  rationale: string;
  preview: Record<string, unknown> | null;
  dry_run_ok: boolean;
  status: ApprovalStatus;
  decided_by: number | null;
  decided_by_email: string | null;
  decided_at: string | null;
  decision_note: string;
  expires_at: string;
  is_expired: boolean;
  consumed_at: string | null;
  created_at: string;
};

// -- tools ------------------------------------------------------------------
export type ToolSpec = {
  name: string;
  description: string;
  domain: string;
  risk_class: RiskClass;
  requires_approval: boolean;
  dry_run_supported: boolean;
  allowed_roles: Role[] | null;
  input_schema: Record<string, unknown>;
};

export type ToolCatalog = {
  count: number;
  tools: ToolSpec[];
};

export type ToolPolicy = {
  id: number;
  tool_name: string;
  enabled: boolean;
  risk_class: RiskClass | "";
  requires_approval: boolean | null;
  allowed_roles: string[];
  max_calls_per_run: number | null;
  updated_at: string;
};

export type InvocationOutcome = "ok" | "denied" | "approval_required" | "error" | "refused";

/** One row per attempt, including denials — this is the safety evidence. */
export type ToolInvocation = {
  id: number;
  tool_name: string;
  risk_class: string;
  actor_type: "agent" | "human" | "system" | "mcp";
  actor_id: string;
  outcome: InvocationOutcome;
  args_hash: string;
  args_redacted: Record<string, unknown>;
  error_code: string;
  error_message: string;
  duration_ms: number;
  trace_id: string;
  transport: string;
  dry_run: boolean;
  is_denial: boolean;
  created_at: string;
};

// -- evals ------------------------------------------------------------------
export type EvalMetrics = {
  triage_accuracy?: number;
  priority_within_tolerance?: number;
  disposition_accuracy?: number;
  tool_precision?: number;
  tool_recall?: number;
  unsafe_action_rate?: number;
  unnecessary_escalation_rate?: number;
  latency_p50_ms?: number | null;
  latency_p95_ms?: number | null;
  mean_cost_usd?: number | null;
  failures?: Record<string, Record<string, number>>;
};

export type EvalRun = {
  id: number;
  mode: "oracle" | "replay" | "live";
  model: string;
  case_count: number;
  passed_count: number;
  gates_passed: boolean;
  metrics: EvalMetrics;
  notes: string;
  duration_ms: number | null;
  created_at: string;
};

// -- directory --------------------------------------------------------------
export type Employee = {
  sam: string;
  display_name: string;
  email: string;
  department: string;
  account_enabled: boolean;
  /** `null` when the backend cannot report lockout state (LDAP without ppolicy). */
  locked_out: boolean | null;
  groups: string[];
};

export type Device = {
  hostname: string;
  model: string;
  assigned_to: string | null;
  last_seen: string | null;
  bitlocker_status: string;
};

// -- dashboard --------------------------------------------------------------
export type Stats = {
  tickets_total: number;
  tickets_open: number;
  agent_touched: number;
  auto_resolved: number;
  auto_resolution_rate: number | null;
  pending_approvals: number;
  /** Denied attempts — the number that proves the guardrails are working. */
  blocked_actions: number;
  runs_total: number;
  runs_failed: number;
  p95_latency_ms: number | null;
  mean_cost_usd: number | null;
  priced_runs: number;
};
