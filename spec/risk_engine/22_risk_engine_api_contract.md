# Risk Engine API Contract (v1)

This contract defines the Phase1 HTTP API between Guardian and Risk Engine.

Principles:
- Deterministic output for same input + ruleset_version
- Explainable reasons for WARN/BLOCK
- Fast response for interactive UX

## Base URL

Phase1 default (local/dev):
http://localhost:8088

## Endpoints

### 1) POST /v1/evaluate

Purpose:
Evaluate a TransactionIntent and return a RiskDecision.

#### Request JSON (TransactionIntentRequest)

Required fields:
- wallet_type: string ("metamask")
- chain_id: integer
- method: string
- from: string
- origin: string
- timestamp_ms: integer
- local_signals: object

Optional fields:
- to: string | null
- value_wei: string | null
- data: string | null
- client_version: string | null
- ruleset_version_hint: string | null

local_signals fields:
- is_new_recipient: boolean
- is_high_value: boolean
- is_unlimited_approval: boolean
- is_suspected_drainer: boolean
- is_contract_call_unknown: boolean

Example (minimal):
{
  "wallet_type": "metamask",
  "chain_id": 1,
  "method": "eth_sendTransaction",
  "from": "0x...",
  "to": "0x...",
  "value_wei": "100000000000000000",
  "data": "0x",
  "origin": "https://example-dapp.com",
  "timestamp_ms": 0,
  "local_signals": {
    "is_new_recipient": true,
    "is_high_value": false,
    "is_unlimited_approval": false,
    "is_suspected_drainer": false,
    "is_contract_call_unknown": false
  }
}

#### Response JSON (RiskDecisionResponse)

Required fields:
- decision: string ("ALLOW" | "WARN" | "BLOCK" | "DELAY")
- risk_score: number (0.0-1.0)
- reasons: array of string
- ui_severity: string ("info" | "warning" | "critical")
- recommended_action: string ("continue" | "cancel" | "delay")
- ruleset_version: string

Optional fields:
- error_code: string | null
- debug: object | null (dev only)

Example:
{
  "decision": "WARN",
  "risk_score": 0.6,
  "reasons": ["New recipient address", "Unusually large amount"],
  "ui_severity": "warning",
  "recommended_action": "cancel",
  "ruleset_version": "ruleset_v1"
}

#### Status Codes
- 200: evaluation completed
- 400: invalid payload
- 500: internal error (still prefer returning a WARN decision with error_code when possible)

### 2) GET /v1/health

Returns service health and active ruleset version.

Example:
{
  "status": "ok",
  "ruleset_version": "ruleset_v1"
}

## Determinism Requirements

- The Risk Engine must include ruleset_version in every response.
- When the ruleset changes, ruleset_version must change.
- Guardian may display ruleset_version in developer mode.

## Failure Policy (Phase1)

If Risk Engine cannot evaluate:
- Preferred response: decision=WARN with reason "Risk Engine error" and error_code set.
- Only return HTTP 500 when the service cannot respond with a valid JSON decision.

## Security Notes

- No private keys, seed phrases, or signature payload contents are sent.
- Requests may include origin and addresses; treat as sensitive telemetry.
- Phase1: do not persist raw requests on server by default.

