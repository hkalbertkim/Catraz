# Catraz Vault Contracts

Initial smart contract architecture for the Catraz Vault system.

## Architecture

The Vault system is split into 3 contracts:

- `Vault.sol`
  - ERC-4337-style smart account validation via `validateUserOp`
  - immediate execution path for low-risk transfers
  - queued execution path for delayed/high-risk transfers
  - daily spending limit enforcement
  - trusted recipient tracking

- `PolicyEngine.sol`
  - programmable policy evaluation layer
  - example policy: `withdraw > threshold` requires guardian approval
  - example policy: `new recipient` requires 24h delay

- `GuardianModule.sol`
  - guardian registry and multi-approval accounting
  - operation-level approval checks used by Vault

## Security Model

1. Transaction enters `Vault`.
2. `PolicyEngine` evaluates risk conditions.
3. Vault either:
   - executes immediately (if low risk), or
   - queues transfer (if delayed / guardian-required).
4. For guardian-required operations, `GuardianModule` must approve before execution.
5. Daily limit is enforced before value transfer.

## ERC-4337 Compatibility (Initial)

`Vault.validateUserOp(...)` provides initial compatibility for account abstraction flows.

- verifies owner signature over `userOpHash`
- supports entry-point-funded missing account funds
- intended as a base implementation for further hardening

## Development

Install dependencies and run tests:

```bash
cd contracts
npm install
npm run compile
npm test
```

Deploy locally:

```bash
npm run deploy
```

Deploy to Sepolia:

```bash
RPC_URL=<rpc> DEPLOYER_PRIVATE_KEY=<key> ENTRY_POINT=<entrypoint> npm run deploy:sepolia
```

## Notes

This is an initial architecture scaffold. Before production use, add full ERC-4337 validation rules, replay protections, signature aggregation support, and formal security reviews.
