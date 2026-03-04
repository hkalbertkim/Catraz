# CATRAZ MVP Build Plan (v2)

Owner: Albert Kim  
Scope: Phase1 (Guardian Extension + Risk Engine API)  
Goal: First runnable end-to-end prototype with MetaMask

## MVP v1 Definition

Target flow:

MetaMask transaction request
-> Guardian intercept (browser extension)
-> Risk Engine API (risk score + decision)
-> Warning UI (popup/overlay)
-> User action (continue/cancel)

Outputs:
- ALLOW
- WARN
- BLOCK
- DELAY (optional in v1, keep as reserved action)

## Non-Goals (v1)

- Vault smart wallet deployment
- On-chain enforcement (Policy Engine)
- Multi-chain support (Solana/Phantom)
- Machine-learning-based scoring
- Threat intelligence network / tokenomics

## Components

### Guardian (Catraz-guardian)
Responsibilities:
- Intercept provider calls (EIP-1193)
- Extract transaction intent (to, value, data, chainId)
- Detect obvious patterns locally (unlimited approvals, new recipient, abnormal amount)
- Call Risk Engine API with normalized payload
- Display decision and explanation before wallet confirmation

### Risk Engine (Catraz-risk-engine)
Responsibilities:
- Decode transaction type (transfer, approve, contract call)
- Rule-based risk scoring
- Return decision + score + explanation list
- Keep response latency low for interactive UX

## Interface Contract (Guardian <-> Risk Engine)

### Request (draft)
Fields:
- wallet_type: "metamask"
- chain_id: number
- method: string (eth_sendTransaction | eth_sign | personal_sign | eth_signTypedData_v4)
- from: string
- to: string | null
- value_wei: string | null
- data: string | null
- origin: string (dApp origin)
- timestamp_ms: number
- local_signals:
  - is_new_recipient: bool
  - is_high_value: bool
  - is_unlimited_approval: bool
  - is_suspected_drainer: bool

### Response (draft)
- decision: "ALLOW" | "WARN" | "BLOCK" | "DELAY"
- risk_score: number (0.0-1.0)
- reasons: list[string] (short, user-readable)
- recommended_action: string (continue/cancel/delay)
- ui_severity: "info" | "warning" | "critical"

## Baseline Risk Rules (v1)

Start:
risk_score = 0.0

Additive signals:
+0.3 if new recipient
+0.3 if high value vs user baseline
+0.4 if unlimited approval
+0.8 if contract/address is flagged malicious (reserved for later; can be static list in v1)

Thresholds:
>=0.7 -> BLOCK
>=0.4 -> WARN
else -> ALLOW

## UX: Warning Flow (v1)

When decision is WARN:
- Show risk score
- Show 2-4 reasons
- Default button: Cancel
- Secondary button: Continue anyway

When decision is BLOCK:
- Show critical warning
- Disable "Continue" by default (optional override toggle for developer mode only)

## Local Test Scenarios (v1)

1) Normal transfer to known address -> ALLOW
2) Transfer to new address with high value -> WARN
3) Unlimited approval (approve(spender, 2^256-1)) -> WARN/BLOCK (based on thresholds)
4) Contract call with unknown data -> WARN (if cannot decode)

## Deliverables Checklist (Docs-Level)

- Guardian intercept points documented
- Risk Engine API contract fixed (payload schema)
- UX warning states defined (ALLOW/WARN/BLOCK)
- Example payloads and example responses

## Next Steps After MVP v1

- Add simulation (tenderly-like local simulation or forked node)
- Add address reputation lookup
- Add behavior profile (local storage)
- Expand to Phantom/Solana
- Start Vault protocol design enforcement (Phase2)

