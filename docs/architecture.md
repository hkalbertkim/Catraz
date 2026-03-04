# Catraz System Architecture (v2)

## Catraz System Architecture

### Overview

Catraz is built as a layered security infrastructure for Web3 wallets. The system sits between decentralized applications and blockchain networks, analyzing and enforcing transaction security before execution.

### Architecture Layers

User Interface Layer

• Browser extension
• Mobile wallet
• Security dashboard

Guardian Layer

• Provider interception
• Transaction monitoring
• Phishing detection

Risk Engine Layer

• Transaction decoding
• Simulation engine
• Behavior analysis
• Threat intelligence

Policy Engine

• Security rule evaluation
• Vault policy enforcement

Vault Smart Wallet

• Smart contract wallet
• Asset custody
• Transaction execution

### High Level Flow

User
↓
DApp
↓
Catraz Guardian
↓
Risk Engine
↓
Policy Engine
↓
Vault Smart Wallet
↓
Blockchain

---
