---
title: "Implementing DNS Failover with AWS Load Balancers and S3 Maintenance Pages"
date: 2025-11-10T09:00:00-05:00
draft: false
author: Brent Ingram
tags: [aws, route53, failover, load-balancer, s3, cloud]
categories: [cloud, networking]
---


This post walks through how I approached implementing DNS-level failover for a web application during a project I worked on. The goal was simple in theory but nuanced in execution: when the application goes down, automatically route users to a static maintenance page.

---

## The Goal

- Primary traffic goes to an application behind a load balancer  
- If the application becomes unhealthy, traffic fails over  
- Users are redirected to a static S3-hosted maintenance page  

This ensures:
- Users never hit a broken app
- You control the failure experience
- You avoid exposing raw infrastructure errors (like 503s)

---

## The Architecture

At a high level:

- **Route 53** manages DNS and failover logic  
- **Application Load Balancer (ALB)** serves live traffic  
- **Auto Scaling Group (ASG)** runs the application  
- **S3 Static Website** hosts the fallback maintenance page  

Flow:

1. User hits domain  
2. Route 53 resolves to primary ALB  
3. Health check monitors ALB  
4. If unhealthy → Route 53 fails over to S3  

---

## Where Things Got Tricky

### 1. Wrong Load Balancer Targeted

Initially, I was pointing failover logic at the wrong load balancer—a backend/internal one instead of the frontend/external one.

The result:
- Health checks didn’t reflect real user experience
- Failover never triggered correctly

Fix:
- Use the external-facing ALB that users actually hit

---

### 2. Health Checks Must Match Reality

At first, health checks weren’t aligned with actual service behavior.

Key adjustments:
- Switched health check to target the correct ALB DNS
- Ensured it reflected real application health

---

### 3. Port Mismatch (Critical Detail)

One subtle but impactful issue:

- Health checks were initially using port 80  
- Application was actually serving over 443 (HTTPS)  

Fix:
- Updated health checks to use port 443  

---

## Setting Up the S3 Maintenance Page

The fallback target is a simple S3 static website.

Example endpoint:
```
http://<bucket-name>.s3-website-<region>.amazonaws.com
```

This becomes your secondary failover target.

---

## Route 53 Failover Configuration

You’ll create two records:

### Primary Record
- Type: A (Alias)  
- Target: Load Balancer  
- Routing policy: Failover (Primary)  
- Health check: Enabled  

### Secondary Record
- Type: A (Alias or CNAME)  
- Target: S3 static website  
- Routing policy: Failover (Secondary)  

---

## Testing the Failover

The most reliable test:

1. Set Auto Scaling Group capacity to 0  
2. Wait for health checks to fail  
3. Observe DNS failover  

---

## Key Lessons Learned

- Always trace the user path  
- Health checks are everything  
- Simplicity wins  
- Validate end-to-end  

---

## Final Take

Failover isn’t about redundancy—it’s about controlled failure.

The difference between a bad outage and a good one is:
- Whether users see a broken system  
- Or a deliberate, predictable experience  

This pattern gives you that control with minimal complexity.
