# AGENTS.md

Rules for AI agents contributing to the Catraz documentation hub.

## 1. Repository Role

This repository is documentation-first. It defines architecture and specifications used by implementation repositories.

Linked implementation repositories:

- `Catraz-guardian`
- `Catraz-protocol`
- `Catraz-risk-engine`

When specs change here, call out downstream impact to these repositories.

## 2. Source of Truth

Use this precedence for architecture and product intent:

1. `docs/whitepaper.md`
2. focused specs in `docs/*.md`
3. root `README.md`

If information conflicts, align docs and leave a clear rationale in the same change.

## 3. Required Structure

Keep and maintain these paths:

- `docs/`
- `diagrams/`
- `roadmap/`

Do not remove required top-level documentation directories.

## 4. Editing Rules

- Make focused, minimal edits.
- Preserve existing terminology: Guardian Layer, Risk Engine, Policy Engine, Vault Smart Wallet.
- Prefer additive updates over destructive rewrites.
- Avoid placeholder claims presented as confirmed facts.

## 5. Cross-Repository Consistency

For any architecture or interface change:

- specify which of `Catraz-guardian`, `Catraz-protocol`, `Catraz-risk-engine` is impacted
- update corresponding docs in this repo (`architecture.md`, `risk_engine_spec.md`, or `vault_wallet_spec.md`)
- include compatibility notes when behavior changes

## 6. Security and Quality Bar

Because Catraz is security infrastructure:

- treat fail-open behavior as a risk and document it explicitly
- prefer explicit ALLOW/WARN/BLOCK/DELAY semantics
- never include secrets, keys, or credentials in repository files

## 7. Commit and PR Expectations

- Use atomic commits with clear scope.
- Keep doc updates testable by review (clear before/after intent).
- Include a short "Affected Repos" section in PR descriptions when relevant.

## 8. Minimum Pre-Merge Checklist

- Required directories and core docs still exist.
- `README.md` reflects current ecosystem positioning.
- Changes are consistent with `docs/whitepaper.md` or intentionally documented as evolution.
- References to `Catraz-guardian`, `Catraz-protocol`, and `Catraz-risk-engine` are accurate.
