---
title: "Building an AI Chatbot: The Deployment Battles No One Warns You About"
date: "2026-05-06"
draft: false
author: Brent Ingram
tags: [aws, lambda, api-gateway, terraform, cors]
categories: [aws, projects]
---

Building an AI chatbot sounds straightforward on paper — hook up a Lambda function, wire it through API Gateway, slap some HTML on top, and ship it. Reality, of course, had other plans. Here's an honest breakdown of every wall I ran into deploying my AI chatbot on AWS, and how I climbed over each one.

---

## Issue #1: The Silent 403 — CORS Rejection Before Lambda Even Runs

The first sign something was wrong came from the chatbot UI, which loaded fine, but the moment I sent a message, the response came back in the chat window as "Sorry, I'm having trouble connecting right now. Please try aghain later."
![chatbot1](https://brentjayingram-website.s3.us-east-1.amazonaws.com/blogimages/chatbot1.png)

I then opened up the browser's DevTools console. 
I opened up as a 403 with no CORS headers — and a cryptic `NetworkError when attempting to fetch resource`.
![chatbot2](https://brentjayingram-website.s3.us-east-1.amazonaws.com/blogimages/chatbot2.png)


```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource 
at https://[id].execute-api.us-east-1.amazonaws.com/dev/ai-chat. 
(Reason: CORS header 'Access-Control-Allow-Origin' missing). Status code: 403.
```

The key insight here was that **a 403 without CORS headers means API Gateway is rejecting the request before it ever reaches Lambda**. This wasn't a Lambda permissions problem — it was an infrastructure problem. Digging into the Terraform configuration revealed three compounding issues:

1. **No Lambda packaging step in CI/CD** — The GitHub Actions workflow had no step to run `zip -j ai_chat.zip chat.py` before `terraform apply`. It was relying on a pre-built zip committed to the repo, which could be stale.

2. **Missing `source_code_hash` on the Lambda resource** — Without this, Terraform had no way to detect when the zip file changed, meaning Lambda was never getting updated even when the code changed.
![chatbot3](https://brentjayingram-website.s3.us-east-1.amazonaws.com/blogimages/chatbot3.png)

3. **CORS resources missing from the deployment trigger** — The API Gateway deployment's `depends_on` and `triggers` hash didn't include the OPTIONS/CORS resources for the `ai-chat` endpoint. This meant CORS configuration changes didn't force a redeployment.
![chatbot4](https://brentjayingram-website.s3.us-east-1.amazonaws.com/blogimages/chatbot4.png)

### The Fix

Three targeted changes resolved this:

- **`setup-actions-and-terraform.yaml`** — Added a packaging step: `zip -j ai_chat.zip chat.py` runs before Terraform, ensuring the Lambda zip is always freshly built from the current source.
- **`terraform/ai_chat.tf` (Lambda)** — Added `source_code_hash = filebase64sha256("ai_chat.zip")` so Terraform can diff the zip and redeploy when it changes.
- **`terraform/ai_chat.tf` (API Gateway)** — Added all OPTIONS/CORS resources to `depends_on` and the `triggers` hash, guaranteeing a fresh API Gateway deployment whenever CORS config changes.

---

## Issue #2: "Stage Already Exists" — Terraform State Conflict

With the CORS fixes merged and CI/CD running, the Terraform plan succeeded — but `apply` blew up with a new error:

```
Error: creating API Gateway Stage (dev): operation error API Gateway: CreateStage, 
https response error StatusCode: 409, ConflictException: Stage already exists
```

The problem was a migration artifact. The old Terraform configuration had used `stage_name = "dev"` inline on the deployment resource (which is invalid in AWS provider v5). Removing that and creating a proper `aws_api_gateway_stage` resource was the right move — but the `dev` stage **already existed in AWS** from the previous deployment. Terraform's state had no record of it as a standalone resource, so it tried to create it fresh and hit a conflict.

### The Fix

The solution was to **import the existing stage into Terraform state** before running `apply`. A new workflow step was added between `terraform plan` and `terraform apply`:

```yaml
- name: Import existing API Gateway stage
  run: terraform import -var="bucket_name=${{ secrets.BUCKET_NAME }}" \
    aws_api_gateway_stage.visitor_api_stage c08e8g3BkS/dev || true
```
![chatbot5](https://brentjayingram-website.s3.us-east-1.amazonaws.com/blogimages/chatbot5.png)
The `|| true` ensures the import step doesn't fail the pipeline if the resource is already in state. After this import, `terraform apply` ran cleanly.

---

## Issue #3: Chat Window Overflow — The CSS vs. JavaScript Layout War

With the backend finally working, testing revealed a frustrating UI bug: the chatbot would receive and display responses, but long messages would overflow past the bottom of the chat window with no scrolling. The content just kept growing outside the visible area.
![chatbot6](https://brentjayingram-website.s3.us-east-1.amazonaws.com/blogimages/chatbot6.png)

The root cause was a subtle conflict between CSS and JavaScript:

- **CSS** set `.chat-container` to `display: flex`
- **JavaScript** overrode it with `display: block` when opening the chat window

This single override broke the entire flex layout chain. The `flex: 1` and `min-height: 0` on the messages div — both required for proper scroll containment — depend entirely on their parent being a flex container. Once JavaScript switched the parent to `display: block`, the overflow scrolling stopped working.

### The Fix

The JavaScript open/close logic was updated to preserve `display: flex` instead of switching to `display: block`. The CSS-driven flex layout was left in full control of the container's display behavior.

---

## Lessons Learned

Deploying cloud-native infrastructure with Terraform and AWS API Gateway comes with a lot of footguns, especially around:

- **Always package Lambda fresh in CI/CD** — never trust a committed zip.
- **Terraform state and real AWS state can diverge** — when migrating resource schemas, import existing resources before applying.
- **CSS and JS fighting over `display`** — a single property override can cascade into a completely broken layout. Let CSS own layout, let JS own behavior.

Each of these bugs was genuinely unintuitive the first time around. Hopefully this saves someone else a few hours of head-scratching.

This is what the chat window looks like now, it's actually scrollable!
![chatbot7](https://brentjayingram-website.s3.us-east-1.amazonaws.com/blogimages/aichatbot7.gif)


---

*Built on AWS Lambda, API Gateway, Terraform, and a healthy dose of stubbornness.*
