# CATRAZ Domain Model Overview (v1)

## High-Level Flow (Phase1)

dApp calls wallet provider method
-> Guardian intercepts and builds TransactionIntent
-> Guardian calls Risk Engine
-> Risk Engine returns RiskDecision
-> Guardian presents UI and user chooses action
-> Wallet receives final user confirmation

## Core Domain Objects

TransactionIntent (Value Object)
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

RiskDecision (Value Object)
- decision (ALLOW/WARN/BLOCK/DELAY)
- risk_score (0.0-1.0)
- reasons (list)
- ui_severity
- recommended_action

RiskProfile (Entity, future)
- user behavior baseline and preferences
- stored locally first, then portable

Policy (Aggregate Root, Phase2+)
- defines enforcement rules at the account level

## Domain Events (Phase1)

TransactionIntercepted
RiskEvaluated
WarningShown
UserChoseOverride
TransactionBlocked

## Determinism Goal

Phase1 scoring must be explainable and deterministic:
same TransactionIntent -> same RiskDecision (given same ruleset version).
