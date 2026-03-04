# CATRAZ

CATRAZ is an AI-native security layer for Web3 wallet protection.
It sits between dApps and wallets to intercept transactions, analyze risk, and warn or block malicious activity.

## Repositories

This repo is the documentation hub. The system is split into four independent repositories:

- Catraz (this repo): documentation source of truth
- Catraz-guardian: browser extension (Guardian)
- Catraz-risk-engine: risk scoring API (Risk Engine)
- Catraz-protocol: smart contracts (Vault + Policy Engine)

## Core Architecture

User -> dApp -> Guardian -> Risk Engine -> Wallet -> Blockchain

Phase1 MVP target flow:
MetaMask transaction -> Guardian intercept -> Risk Engine decision -> warning popup

## Documentation Index

- whitepaper.md
- docs/architecture.md
- docs/risk_engine_spec.md
- docs/vault_wallet_spec.md
- docs/tokenomics_future.md

Additional v2 docs (to be created next):
- docs/mvp_build_plan.md
- docs/repo_structure.md
- docs/reset_runbook.md
- docs/security_philosophy.md

## Status

Documentation-only reset is in progress.
All v2 docs are being rebuilt from a single source of truth (whitepaper.md) and consolidated under docs/.

