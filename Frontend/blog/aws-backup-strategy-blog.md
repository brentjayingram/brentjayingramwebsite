---
title: "Designing a Scalable AWS Backup Strategy with Cross-Account Immutability"
date: 2023-11-15T10:00:00-05:00
draft: false
author: Brent Ingram
tags: [aws, backup, terraform, disaster-recovery, cloud]
categories: [cloud, infrastructure]
---


When you move beyond basic backups in AWS, the real challenge isn’t *taking* backups—it’s designing a system that is resilient, scalable, and secure against worst-case scenarios like account compromise.

This post breaks down a practical architecture for building a centralized, immutable backup strategy across multiple AWS accounts using infrastructure as code. This was my thought process behind a project that I worked on.

---

## The Goal

At a high level, the system is designed to:

- Back up core services (EC2, RDS, EFS) within each account
- Store backups locally in-region
- Copy backups to a separate **backup account**
- Ensure backups in that account are **immutable**
- Apply consistent retention policies across environments

This creates a layered defense:
1. Local recovery (fast restores)
2. Cross-account recovery (blast radius protection)
3. Immutable storage (ransomware / deletion protection)

fileciteturn1file0

---

## Core Design Principles

### 1. Cross-Account Isolation

Backups should never live only in the same account as the workload.

Instead:
- Primary account → creates backup
- Backup account → receives copy
- Backup account → enforces immutability

This ensures that even if the primary account is compromised, backups remain safe.

---

### 2. Immutability is Non-Negotiable

The backup account should enforce **write-once behavior**.

That means:
- Backups can be written
- Backups cannot be modified or deleted

This is your last line of defense.

---

### 3. Tiered Retention Strategy

Not all data is equal.

A practical policy:
- **Production:** 21-day retention
- **Development:** 14-day retention
- **Critical systems ("crown jewels"):** extended retention (e.g., 6 months)

This balances cost with risk.

---

## Architecture Overview

### In Each Workload Account

- Backup vaults per region
- Backup policies applied via tagging
- Resources backed up:
  - EC2 (entire instance, not just volumes)
  - RDS
  - EFS

### Cross-Region Strategy

Each account should:
- Store backups in the primary region
- Copy backups to a **secondary region**

This protects against regional outages.

---

### Central Backup Account

This account contains:

- Immutable vaults
- Cross-account access roles
- Minimal permissions (write-only from other accounts)

It acts as your **final recovery layer**.

---

## Terraform-First Approach

To make this scalable, everything should be codified.

### Key Components

1. **Reusable Vault Module**
   - Standardizes vault creation
   - Handles immutability configuration
   - Ensures consistent naming

2. **Terraform Workspaces**
   - One per account/environment
   - Centralized state management

3. **Organization-Level Policies**
   - Enforce retention rules
   - Apply based on tags
   - Ensure compliance across accounts

fileciteturn1file0

---

## Naming Strategy (More Important Than It Seems)

Consistency matters more than creativity.

Example pattern:
```
bv-<env>-<frequency>-<region>
```

Why this matters:
- Policies can target multiple accounts easily
- Reduces operational confusion
- Makes automation predictable

---

## Backup Policy Considerations

A few key decisions shape everything:

### What gets backed up?
- EC2 (full instance)
- RDS
- EFS
- Potentially ECS/Fargate workloads (case-by-case)

### What doesn’t?
- S3 (often handled separately with lifecycle/versioning)

### How are policies applied?
- Tag-based targeting is the most scalable approach

---

## Operational Gaps to Think Through

This is where most implementations fall short:

### 1. “Crown Jewel” Identification
You need to explicitly define:
- What systems are business-critical?
- What recovery time is acceptable?

### 2. Permissions Model
The backup role must:
- Write across accounts
- Not have delete permissions across accounts

This is a subtle but critical boundary.

### 3. Immutability Timing
You can’t enable immutability retroactively without consequences.

Plan it upfront—or you’ll be stuck with legacy snapshots.

---

## Reporting and Visibility

Backups that no one monitors are just expensive guesses.

A solid pattern:
- Emit backup events
- Send results to an external system (e.g., ITSM platform)
- Track success/failure centrally

This closes the loop from **backup → validation → alerting**.

fileciteturn1file0

---

## Implementation Roadmap

A practical sequence:

1. Set up Terraform workspaces  
2. Build reusable backup vault module  
3. Deploy vaults across accounts/regions  
4. Implement backup policies  
5. Configure cross-account copy  
6. Enable immutability  
7. Add reporting and monitoring  

This order matters—don’t skip ahead.

---

## Final Take

The biggest mistake in backup design is thinking in terms of *features* instead of *failure modes*.

A strong system answers:
- What if the account is compromised?
- What if the region fails?
- What if someone deletes everything?

If your design handles those three scenarios, you’re in a very small (and very safe) minority.

The rest is just implementation.
