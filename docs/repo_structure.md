# CATRAZ Repo Structure (v2)

Goal: Keep repo boundaries clean so implementation can evolve without documentation drift.

## Workspace Layout

/Users/albertkim/02_PROJECTS/11_CATRAZ

- Catraz
- Catraz-guardian
- Catraz-risk-engine
- Catraz-protocol

Each folder is an independent git repository.

## Repository Responsibilities

### 1) Catraz (Docs Hub)
Purpose:
- Source of truth for product vision, architecture, and phase roadmap
- Documentation baseline for all repos

Must contain:
- whitepaper.md
- README.md
- docs/ (architecture + specs + build plan)

Must NOT contain:
- production code for extension, backend, or contracts

Docs in this repo:
- docs/architecture.md
- docs/mvp_build_plan.md
- docs/risk_engine_spec.md
- docs/vault_wallet_spec.md
- docs/tokenomics_future.md
- docs/repo_structure.md
(Next: docs/reset_runbook.md, docs/security_philosophy.md)

### 2) Catraz-guardian (Browser Extension)
Purpose:
- Guardian extension (Chrome MV3)
- Provider interception + UX warning layer

Owns:
- EIP-1193 interception implementation
- Popup/overlay UI
- Local rule signals and local telemetry

Docs in that repo:
- docs/guardian_spec.md
- docs/provider_intercept.md
- docs/ux_warning_flows.md

### 3) Catraz-risk-engine (API)
Purpose:
- Risk scoring API prototype (Phase1)
- Decoding + ruleset + scoring + response formatting

Owns:
- API schema (request/response contract)
- Scoring engine logic
- Optional simulation module (future)

Docs in that repo:
- docs/risk_engine_api.md
- docs/ruleset.md
- docs/telemetry.md

### 4) Catraz-protocol (Smart Contracts)
Purpose:
- Phase2+ smart contracts for Vault + Policy Engine

Owns:
- Vault wallet contracts
- Policy engine and enforcement actions
- Upgradeability/security assumptions

Docs in that repo:
- docs/vault_wallet_spec.md (copy/derivative of hub spec)
- docs/policy_engine_spec.md
- docs/security_assumptions.md

## Dependency Rules

- Guardian depends on Risk Engine via HTTP API (Phase1).
- Protocol is isolated in Phase1 (no dependency required).
- Catraz (docs hub) has no runtime dependencies.

## Naming Conventions

- Use consistent component names: Guardian / Risk Engine / Policy Engine / Vault.
- Decisions: ALLOW / WARN / BLOCK / DELAY.
- Risk score range: 0.0-1.0.

