# Catraz System Architecture

## Source
Extracted from `catraz_whitepaper_v_1.md` section **#4. System Architecture**.

## High-Level Architecture

User  
↓  
Catraz Guardian  
↓  
Catraz Risk Engine  
↓  
Policy Engine  
↓  
Vault Smart Wallet  
↓  
Blockchain

## Supporting Network

- Threat Intelligence Network
- Security Oracle Network
- Insurance Pool

## Implementation Repository Mapping

- `Catraz-guardian`: Guardian Layer interfaces and transaction interception
- `Catraz-risk-engine`: Risk Engine pipeline, simulation, and scoring
- `Catraz-protocol`: Policy Engine and Vault Smart Wallet contracts
