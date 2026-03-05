# CATRAZ Ubiquitous Language (v1)

This document defines the canonical terms used across CATRAZ.

## Core Components

Guardian
- Browser extension layer that intercepts wallet provider requests and presents warnings.

Risk Engine
- Service that evaluates a transaction intent and returns a decision and reasons.

Policy Engine
- Rule evaluation layer that determines enforcement actions based on risk and user policy.
- Phase1: minimal/off-chain logic
- Phase2+: on-chain enforcement via Vault

Vault
- Smart contract wallet that enforces account-level protection (Phase2+).

## Core Concepts

Transaction Intent
- Normalized representation of what the user is about to do.
- Includes method, from/to, value, data, origin, chain_id, and derived signals.

Decision
- ALLOW: proceed without warning
- WARN: proceed only after showing warning UI
- BLOCK: prevent user from submitting transaction
- DELAY: hold execution for a time window (reserved for v1)

Risk Score
- 0.0-1.0 normalized score representing danger probability/severity.

Reason
- Short user-readable explanation for a decision.

Local Signals
- Heuristics computed inside Guardian (new recipient, high value, unlimited approval).

Threat Intelligence
- External or local reputation signals (malicious contract/address list).
- Phase1: static list optional
- Future: network-fed intelligence

## Actors

User
- Signs transactions in wallet UI.

dApp
- Website initiating provider requests.

Wallet
- MetaMask/Phantom/Rabby providing the signing surface.

## Invariants

- CATRAZ must never require seed phrase or private key.
- CATRAZ must complete interactive decisions fast enough for UX (target sub-second).
