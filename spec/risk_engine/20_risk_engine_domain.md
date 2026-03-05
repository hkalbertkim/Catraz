# Risk Engine Domain (DDD) v1

Bounded Context: Risk Scoring  
Primary role: produce deterministic, explainable RiskDecision from a TransactionIntent.

## 1. Responsibilities

Risk Engine owns:
- Transaction classification (transfer, approve, contract call)
- Rule-based scoring (Phase1)
- Decision mapping (ALLOW/WARN/BLOCK/DELAY)
- Reasons generation (user-readable)
- Ruleset versioning (important for determinism)
- Performance constraints (interactive response)

Risk Engine does not own:
- Provider interception (Guardian)
- Wallet UI (Guardian)
- On-chain enforcement (Protocol/Vault)
- Global threat intel network (future source)

## 2. Ubiquitous Language (Risk Engine-specific)

TransactionIntent
- Input VO from Guardian.

TransactionClass
- Derived classification of intent.

RiskSignal
- Individual signal contributing to score (unlimited approval, new recipient, etc).

RiskScore
- Normalized score 0.0-1.0.

Decision
- ALLOW/WARN/BLOCK/DELAY.

Reason
- Short explanation corresponding to one or more signals.

Ruleset
- Versioned set of rules and thresholds.

Determinism
- Same input and same ruleset version yields same output.

## 3. Domain Model

### 3.1 Value Objects

TransactionClass (VO)
- class_name (TRANSFER | APPROVAL | CONTRACT_CALL | SIGN_MESSAGE | UNKNOWN)
- confidence (0.0-1.0)

RiskSignal (VO)
- key
- weight (0.0-1.0)
- triggered (bool)
- details (optional)

RiskScore (VO)
- score (0.0-1.0)
- components (list of RiskSignal)

RiskDecision (VO)
- decision
- risk_score
- reasons[]
- ui_severity
- recommended_action
- ruleset_version

RulesetVersion (VO)
- id (e.g., "ruleset_v1")
- created_at
- thresholds (warn, block)
- rule_keys enabled

### 3.2 Entities

Ruleset (Entity)
- version_id
- thresholds
- rule_definitions

### 3.3 Aggregates

RiskEvaluation (Aggregate Root)
- Root: RiskDecision
- Inputs:
  - TransactionIntent
  - RulesetVersion
- Invariants:
  - Must output a ruleset_version
  - Must keep score within 0.0-1.0
  - Must return at least one reason for WARN/BLOCK unless fallback error mode

## 4. Scoring (Phase1)

Baseline signals (from intent + local_signals):
- new_recipient (weight 0.3)
- high_value (weight 0.3)
- unlimited_approval (weight 0.4)
- malicious_reputation (weight 0.8) (optional static list in v1)

Score computation (Phase1):
- additive sum of triggered weights, capped at 1.0

Thresholds:
- warn_threshold = 0.4
- block_threshold = 0.7

Decision mapping:
- score >= block_threshold -> BLOCK
- score >= warn_threshold -> WARN
- else -> ALLOW
- DELAY reserved (Phase1 only if policy wants time-based hold)

## 5. Commands and Queries

Commands:
- EvaluateRisk (TransactionIntent -> RiskDecision)
- LoadRulesetVersion (startup)
- UpdateRulesetVersion (future, controlled)

Queries:
- GetRulesetVersion
- HealthCheck

## 6. Domain Events

RiskEvaluationRequested
RiskEvaluationCompleted
RulesetLoaded
RulesetUpdated (future)

## 7. Performance and Reliability Targets

Phase1 targets:
- Total evaluation time: <300ms (ideal)
- Hard ceiling: <1000ms
- If upstream simulation is added later, keep progressive enhancement:
  - fast rules first
  - simulation only when necessary

Failure behavior:
- If evaluation fails, return WARN with reason "Risk Engine error" and a stable error code.

## 8. Explainability (Phase1)

Reasons must be:
- short
- non-technical
- directly mapped to triggered signals

Example reasons:
- "New recipient address"
- "Unusually large amount"
- "Unlimited token approval detected"
- "Known malicious contract"

