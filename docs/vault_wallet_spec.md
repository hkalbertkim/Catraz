# Catraz Vault Wallet Specification (v2)

## Catraz Vault Wallet Specification

### Overview

Catraz Vault is a programmable smart contract wallet built using Account Abstraction principles.

### Core Capabilities

Programmable transaction policies

Multi-signature approvals

Guardian recovery

Withdrawal delays

Daily spending limits

### Account Structure

VaultAccount

WithdrawalPolicy

GuardianPolicy

RecoveryPolicy

SpendingLimit

### Example Policies

Withdrawal > $10k

→ guardian approval required

New address transfer

→ 24h delay

---
