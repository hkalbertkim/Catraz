# CATRAZ Development Reset Runbook

Purpose:
Provide a clean and repeatable procedure for resetting the CATRAZ workspace when Git conflicts or repository drift occurs.

## Workspace Root

/Users/albertkim/02_PROJECTS/11_CATRAZ

Repositories:

- Catraz
- Catraz-guardian
- Catraz-risk-engine
- Catraz-protocol

Each repository is independent.

## When Reset Is Needed

Typical reasons:

- Git history conflicts
- Incorrect repository initialization
- Mixed documentation/code states
- Broken branch structures

## Clean Reset Procedure

Step 1 — Remove local repositories

cd /Users/albertkim/02_PROJECTS/11_CATRAZ

rm -rf Catraz
rm -rf Catraz-guardian
rm -rf Catraz-risk-engine
rm -rf Catraz-protocol

Step 2 — Clone repositories again

git clone git@github.com:hkalbertkim/Catraz.git
git clone git@github.com:hkalbertkim/Catraz-guardian.git
git clone git@github.com:hkalbertkim/Catraz-risk-engine.git
git clone git@github.com:hkalbertkim/Catraz-protocol.git

Step 3 — Verify repositories

cd Catraz
git status

Repeat for other repos.

## Branch Policy

Main branch:

main

Working branches:

docs/*
feature/*
experiment/*

Example:

docs/reset-v2

## Documentation Source of Truth

The Catraz repository acts as the documentation hub.

Key files:

whitepaper.md
docs/architecture.md
docs/mvp_build_plan.md

Other repositories reference these documents.

## Notes

Avoid mixing documentation and code repositories.
Keep documentation updates in Catraz repo first.

