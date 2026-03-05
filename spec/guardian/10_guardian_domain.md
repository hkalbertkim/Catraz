# Guardian Domain (DDD) v1

Bounded Context: Guardian  
Primary role: intercept wallet provider calls and enforce user-facing security UX before signing.

## 1. Responsibilities

Guardian owns:
- Provider interception (EIP-1193 request capture)
- TransactionIntent construction (normalization)
- LocalSignals computation (heuristics)
- Risk Engine invocation (HTTP request/response)
- Warning UI flow (popup/overlay) and user choice capture
- Minimal local telemetry (privacy-first)

Guardian does not own:
- Risk scoring logic (Risk Engine)
- On-chain enforcement (Protocol/Vault)
- Global threat intelligence feeds (future)

## 2. Ubiquitous Language (Guardian-specific)

ProviderRequest
- A wallet provider call initiated by a dApp.

Intercept
- The act of capturing a ProviderRequest before it reaches wallet UI.

TransactionIntent
- Normalized intent derived from a ProviderRequest.

LocalSignals
- Local heuristics computed inside Guardian.

RiskDecision
- Decision returned from Risk Engine.

WarningFlow
- UI sequence shown to the user when decision is WARN/BLOCK.

Override
- User chooses to proceed despite WARN (developer mode optional).

## 3. Domain Model

### 3.1 Value Objects

ProviderRequest (VO)
- method
- params (raw)
- origin (dApp)
- timestamp_ms

TransactionIntent (VO)
- wallet_type
- chain_id
- method
- from
- to
- value_wei
- data
- origin
- timestamp_ms
- local_signals
- ruleset_version (optional)
- client_version (optional)

LocalSignals (VO)
- is_new_recipient
- is_high_value
- is_unlimited_approval
- is_suspected_drainer
- is_contract_call_unknown

RiskDecision (VO)
- decision (ALLOW/WARN/BLOCK/DELAY)
- risk_score
- reasons[]
- ui_severity
- recommended_action

UserChoice (VO)
- choice (CANCEL | CONTINUE)
- acknowledged_risk (bool)
- timestamp_ms

### 3.2 Entities

Session (Entity)
- Represents a single intercepted interaction lifecycle.
- id (session_id)
- origin
- started_at
- latest_intent
- latest_decision
- latest_user_choice

### 3.3 Aggregates

InterceptSession (Aggregate Root)
- Root: Session
- Invariants:
  - A RiskDecision must correspond to a TransactionIntent.
  - A UserChoice must correspond to the latest RiskDecision.
  - If decision is BLOCK, default must be CANCEL unless developer override is explicitly enabled.

## 4. Commands and Queries

Commands:
- InterceptProviderRequest
- BuildTransactionIntent
- ComputeLocalSignals
- RequestRiskDecision
- PresentWarningFlow
- RecordUserChoice
- ReleaseOrBlockRequest

Queries:
- GetLocalRecipientHistory (future)
- GetUserBaseline (future)

## 5. Domain Events

TransactionIntercepted
- emitted when ProviderRequest is captured

TransactionIntentBuilt
- emitted after normalization

LocalSignalsComputed
- emitted after heuristics

RiskDecisionReceived
- emitted when Risk Engine responds

WarningShown
- emitted when WARN/BLOCK UI rendered

UserOverrideChosen
- emitted when user continues despite WARN

TransactionBlocked
- emitted when request is prevented

TransactionReleased
- emitted when request proceeds to wallet UI

## 6. State Machine (Session Lifecycle)

Start
-> Intercepted
-> IntentBuilt
-> SignalsComputed
-> RiskRequested
-> DecisionReceived
-> (ALLOW) Released
-> (WARN) WarningShown -> UserChoice -> Released or Blocked
-> (BLOCK) WarningShown -> Blocked (override optional)

## 7. Privacy and Storage (Phase1)

Phase1 default:
- Store minimal session telemetry locally only.
- No seed phrase, no private keys, no signature content capture.
- origin and to-address may be stored locally for user baseline (optional, configurable).

## 8. Error Handling (Phase1)

If Risk Engine is unreachable:
- Default mode: WARN with generic reason "Risk Engine unavailable"
- Developer mode option: ALLOW (for local testing only)

If TransactionIntent cannot be parsed:
- WARN with reason "Unable to decode transaction intent"

