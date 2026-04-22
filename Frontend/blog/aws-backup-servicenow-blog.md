---
title: "How to Send AWS Backup Events to ServiceNow (Using EventBridge, SNS, and CloudWatch)"
date: 2024-04-20T20:19:33-08:00
draft: false
author: Brent Ingram
tags: [aws, terraform]
categories: [aws, terraform]
---


If you're running backups in AWS and want real operational visibility, pushing backup events into your ITSM platform (like ServiceNow) is a strong pattern. It gives you centralized alerting, incident creation, and better observability without reinventing monitoring.

This guide walks through a simple, scalable way to do it using native AWS services.

---

## The Architecture (Simple Mental Model)

At a high level:

- **AWS Backup** emits events  
- **EventBridge** filters and routes them  
- **SNS** delivers them  
- **ServiceNow** receives them via webhook  
- **CloudWatch Logs** optionally stores them for audit/debug  

Think of it as:  
**Event → Filter → Fan-out → External System**

---

## Step 1: Capture Backup Events with EventBridge

AWS Backup automatically emits events like job completion or failure. You don’t need to instrument anything—just subscribe to them.

Create an EventBridge rule with this event pattern:

### Backup Jobs
```json
{
  "detail-type": ["Backup Job State Change"],
  "source": ["aws.backup"],
  "detail": {
    "state": ["COMPLETED", "FAILED"]
  }
}
```

### Copy Jobs (if you're using cross-region/account copies)
```json
{
  "detail-type": ["Copy Job State Change"],
  "source": ["aws.backup"],
  "detail": {
    "state": ["COMPLETED", "FAILED"]
  }
}
```

This ensures you only capture meaningful state transitions—not noise.

---

## Step 2: Route Events to SNS

Create an SNS topic to act as your delivery mechanism.

Typical naming convention:
- `backup-job-status`
- `copy-job-status`

### Why SNS?

- Decouples producers (AWS Backup) from consumers (ServiceNow)
- Lets you add additional subscribers later (Slack, email, Lambda, etc.)
- Provides retry logic and delivery guarantees

Attach the SNS topic as the **target** for your EventBridge rule.

---

## Step 3: Subscribe ServiceNow via HTTPS Endpoint

Now connect SNS to ServiceNow.

Create an **HTTPS subscription** on the SNS topic that points to your ServiceNow Event Management API endpoint.

Example:
```
https://<instance>.service-now.com/api/.../inbound_event
```

Once configured:
- SNS will send a **subscription confirmation**
- ServiceNow must accept it
- After that, events flow automatically

This is the key integration point where AWS meets your ITSM workflow.

---

## Step 4: (Optional but Recommended) Add CloudWatch Log Groups

For visibility and debugging, create log groups like:

- `/aws/events/backupjob`
- `/aws/events/copyjob`

Then configure EventBridge to also send events there.

### Why this matters:

- Debug failed deliveries
- Audit historical backup activity
- Validate payload structure before it hits ServiceNow

This becomes your “source of truth” when something doesn’t line up.

---

## Step 5: Validate End-to-End Flow

Test the pipeline:

1. Trigger a backup job manually  
2. Wait for completion (or force a failure scenario)  
3. Verify:
   - Event appears in CloudWatch Logs
   - SNS shows delivery success
   - ServiceNow receives and processes the event  

If something breaks, check in this order:
- EventBridge rule matching
- SNS subscription confirmation
- Endpoint authentication / payload handling

---

## Design Considerations (Where Most People Get It Wrong)

### 1. Don’t forward everything
Filter at EventBridge. Only send meaningful states like `FAILED` and `COMPLETED`. Otherwise, you’ll overwhelm your ITSM system.

### 2. Normalize payloads early (if needed)
If ServiceNow expects a specific schema, consider inserting a Lambda between EventBridge and SNS to transform the payload.

### 3. Think multi-account early
If you have multiple AWS accounts:
- Standardize topic naming
- Consider centralizing events into a shared account

### 4. Plan for retries and failures
SNS retries automatically, but your endpoint must:
- Handle duplicate events
- Be idempotent

---

## Final Take

This pattern is effective because it’s:

- **Event-driven** (no polling)
- **Loosely coupled** (SNS abstraction)
- **Extensible** (add more consumers anytime)

If you were to level this up further, the next step wouldn’t be “more tooling”—it would be:

> Introducing a normalization/enrichment layer (Lambda or EventBridge Pipes) so ServiceNow receives structured, actionable events instead of raw AWS payloads.
