# Example Payloads (Phase1) v1

This appendix provides concrete request/response examples for Guardian <-> Risk Engine.

Endpoint:
POST /v1/evaluate

## Case A: Normal transfer to known recipient (ALLOW)

Request:
{
  "wallet_type": "metamask",
  "chain_id": 1,
  "method": "eth_sendTransaction",
  "from": "0xF0...01",
  "to": "0xAA...02",
  "value_wei": "10000000000000000",
  "data": "0x",
  "origin": "https://trusted-dapp.com",
  "timestamp_ms": 1710000000000,
  "local_signals": {
    "is_new_recipient": false,
    "is_high_value": false,
    "is_unlimited_approval": false,
    "is_suspected_drainer": false,
    "is_contract_call_unknown": false
  }
}

Response:
{
  "decision": "ALLOW",
  "risk_score": 0.0,
  "reasons": [],
  "ui_severity": "info",
  "recommended_action": "continue",
  "ruleset_version": "ruleset_v1"
}

## Case B: Transfer to new recipient with high value (WARN)

Request:
{
  "wallet_type": "metamask",
  "chain_id": 1,
  "method": "eth_sendTransaction",
  "from": "0xF0...01",
  "to": "0xBB...03",
  "value_wei": "5000000000000000000",
  "data": "0x",
  "origin": "https://random-dapp.com",
  "timestamp_ms": 1710000001000,
  "local_signals": {
    "is_new_recipient": true,
    "is_high_value": true,
    "is_unlimited_approval": false,
    "is_suspected_drainer": false,
    "is_contract_call_unknown": false
  }
}

Response:
{
  "decision": "WARN",
  "risk_score": 0.6,
  "reasons": ["New recipient address", "Unusually large amount"],
  "ui_severity": "warning",
  "recommended_action": "cancel",
  "ruleset_version": "ruleset_v1"
}

## Case C: Unlimited approval (WARN/BLOCK depending on thresholds)

Request:
{
  "wallet_type": "metamask",
  "chain_id": 1,
  "method": "eth_sendTransaction",
  "from": "0xF0...01",
  "to": "0xTokenContract...04",
  "value_wei": "0",
  "data": "0x095ea7b3FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
  "origin": "https://untrusted-swap.com",
  "timestamp_ms": 1710000002000,
  "local_signals": {
    "is_new_recipient": false,
    "is_high_value": false,
    "is_unlimited_approval": true,
    "is_suspected_drainer": false,
    "is_contract_call_unknown": false
  }
}

Response (WARN example):
{
  "decision": "WARN",
  "risk_score": 0.4,
  "reasons": ["Unlimited token approval detected"],
  "ui_severity": "warning",
  "recommended_action": "cancel",
  "ruleset_version": "ruleset_v1"
}

## Case D: Unknown contract call (WARN)

Request:
{
  "wallet_type": "metamask",
  "chain_id": 1,
  "method": "eth_sendTransaction",
  "from": "0xF0...01",
  "to": "0xUnknownContract...05",
  "value_wei": "0",
  "data": "0xabcdef0123456789",
  "origin": "https://unknown-dapp.com",
  "timestamp_ms": 1710000003000,
  "local_signals": {
    "is_new_recipient": true,
    "is_high_value": false,
    "is_unlimited_approval": false,
    "is_suspected_drainer": false,
    "is_contract_call_unknown": true
  }
}

Response:
{
  "decision": "WARN",
  "risk_score": 0.6,
  "reasons": ["New recipient address", "Unable to decode contract call"],
  "ui_severity": "warning",
  "recommended_action": "cancel",
  "ruleset_version": "ruleset_v1"
}

## Case E: Risk Engine failure fallback (WARN)

Response:
{
  "decision": "WARN",
  "risk_score": 0.4,
  "reasons": ["Risk Engine unavailable"],
  "ui_severity": "warning",
  "recommended_action": "cancel",
  "ruleset_version": "ruleset_v1",
  "error_code": "RISK_ENGINE_UNREACHABLE"
}

