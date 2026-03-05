# CATRAZ Bounded Contexts (v1)

## Context Map (Phase1)

Guardian Context
- Owns interception, local signals, and user warnings.
- Integrates with Risk Engine via HTTP API.

Risk Scoring Context
- Owns transaction classification, scoring, and decision output.
- Provides deterministic, explainable results.

## Context Map (Phase2+)

Protocol Context (Vault + Policy)
- Owns on-chain enforcement and account-level protection.
- Consumes risk signals and user policies.

Threat Intelligence Context (Future)
- Owns reputation data pipelines, signatures, and distributed validation.

## Integration Contracts

Guardian -> Risk Engine
- TransactionIntentRequest -> RiskDecisionResponse

Risk Engine -> (Future) Threat Intelligence
- ReputationQuery -> ReputationSignals

Guardian/Risk Engine -> (Future) Protocol
- PolicyInputs -> EnforcementActions
