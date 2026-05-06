---
title: "From Resume to RAG: How I Built a Knowledge Base for My AI Chatbot"
date: "2026-05-06"
draft: false
author: Brent Ingram
tags: [aws, bedrock, knowledge-base, rag, ai, onenote, obsidian, s3]
categories: [aws, ai, projects]
---

When I first added an AI chatbot to my personal website, I gave it one thing to work with: my resume. That was enough to answer the basics — what roles I've held, what certifications I have, where I've worked. But the moment someone asked anything deeper, anything that required nuance or real context about the work I've actually done, the chatbot hit a wall.

I knew there was a better way. I just didn't know how much of a journey it would be to get there.

## The Problem with Resume-Only Context

A resume is a highlight reel. It names the projects, lists the tools, and nods at the outcomes. What it doesn't capture is the *how* — the decisions made along the way, the architecture choices, the troubleshooting that happened at 11pm, the lessons that only come from actually doing the work.

My chatbot could tell you I worked with AWS Backup. It couldn't explain how I architected the backup strategy, how I wired EventBridge into ServiceNow, or why we chose the approach we did. That knowledge lived somewhere else entirely: hundreds of notes I'd accumulated in OneNote over the years.

That's what I wanted to unlock.

## Enter AWS Bedrock Knowledge Bases

I came across a YouTube tutorial — [Amazon Bedrock for Beginners – From First Prompt to AI Agent (Full Tutorial)](https://www.youtube.com/watch?v=FAgmR9VV0GQ) — that walked through setting up a RAG pipeline, and it clicked immediately as the right approach for what I was trying to do. I adapted the core setup for my chatbot and went from there.

AWS Bedrock Knowledge Bases lets you connect a document store to a foundation model, turning a pile of files into a searchable, retrieval-augmented source of truth. The idea is simple: you upload your documents, Bedrock indexes them into a vector store, and when someone asks a question, the system retrieves the most relevant chunks before passing them to the model as context.

It's called Retrieval-Augmented Generation — RAG — and it's exactly what I needed. Instead of the model guessing from general training data, it would pull directly from *my* notes before answering.

There was just one problem.

## OneNote Doesn't Play Well with Knowledge Bases

All of my AWS notes lived in OneNote. Hundreds of them — organized into notebooks by topic, covering services, architectures, troubleshooting patterns, and real project work. OneNote is great for capturing things on the fly. It is not great for feeding into an AWS Knowledge Base.

Knowledge Bases supports Markdown, PDF, HTML, Word documents, and a handful of other formats. OneNote's native format is not on that list. There's no direct export path that produces clean, indexable documents.

I needed to convert everything, and I needed the output to actually be usable — not a wall of formatting artifacts and stray XML.

## The Obsidian Importer Solution

After exploring a few options, I landed on [Obsidian](https://obsidian.md/) and its **Importer plugin**. The workflow looked like this:

1. Export OneNote notebooks from the OneNote desktop app as `.one` files or via the export menu
2. Use the Obsidian Importer plugin to convert the OneNote exports into Markdown
3. Review the output in Obsidian's editor, which renders Markdown natively

The Importer did a remarkably clean job. Section headers came through as Markdown headings. Lists stayed as lists. Code blocks stayed as code blocks. Some notes had embedded images or tables that needed manual cleanup, but the structural conversion was solid.

What I ended up with was a folder full of `.md` files — one per note — that actually represented the knowledge I'd built up over time in a format that tools could read.

## Cleaning the Data

Converting is only half the battle. Raw exports are messy. Notes written in the moment aren't written for an audience — they're shorthand, incomplete sentences, references to context that only makes sense if you remember writing them.

I went through the exported Markdown and cleaned it up:

- **Removed orphaned metadata**: OneNote embeds a lot of noise — creation dates, author tags, sync metadata — that survived the conversion in some files. I stripped anything that wouldn't add context.
- **Stripped sensitive content**: Some notes contained details tied to prior employers or internal project specifics that weren't mine to share publicly. Anything that could identify a client, expose internal architecture, or reference proprietary work got cut.
- **Fixed broken structure**: Some notes had heading hierarchies that didn't make sense after conversion. I normalized these.
- **Expanded abbreviations**: Shorthand that made sense in the moment ("BP rule → SNS → SN webhook") got expanded into full sentences.
- **Removed duplicates**: Years of note-taking means overlapping content. I consolidated where I could.

This wasn't fast work, but it mattered. Garbage in, garbage out — if the knowledge base is full of half-finished thoughts and broken formatting, the RAG retrieval will surface half-finished answers.

## Uploading to the Knowledge Base

With clean Markdown files in hand, I created an S3 bucket to serve as the Knowledge Base data source and uploaded the notes there. From the Bedrock console, I:

1. Created a new Knowledge Base and pointed it at the S3 bucket
2. Selected an embeddings model to handle the vectorization (Amazon Titan Embeddings)
3. Chose S3 as the vector store
4. Ran the initial sync to index all the documents

Bedrock chunked each file, ran the chunks through the embeddings model, and stored the resulting vectors. After the sync completed, I could run test queries directly in the console — and the results were immediately more useful than anything the resume-only chatbot had ever returned.

## Wiring the Chatbot to Use RAG

The final step was switching the chatbot's Lambda function from using the resume as static context to querying the Knowledge Base dynamically before each response.

The flow changed from:

```
User message → Static resume context + message → Bedrock model → Response
```

To:

```
User message → Knowledge Base retrieval → Retrieved context + message → Bedrock model → Response
```

The Lambda now calls `bedrock-agent-runtime`'s `retrieve` API with the user's message, pulls the top-K most relevant document chunks, and passes them as context to the model. The model generates a response grounded in actual retrieved content rather than guessing from its training data alone.

The difference in response quality was noticeable immediately. Questions about specific AWS services, architectural decisions, and project-level work now get answers rooted in real context — because that context is actually there.

## What Changed

Before the upgrade, the chatbot could answer about five categories of questions well:

- Basic background and work history
- Certifications
- General skills listed on the resume
- Where I went to school
- Contact information

After the RAG upgrade, the chatbot can engage with real technical depth on topics I've documented in my notes — AWS Backup architectures, monitoring strategies, infrastructure-as-code patterns, troubleshooting approaches, and more. It's not a generalist anymore. It's a narrowly focused assistant that knows the specific work I've done.

## What's Next

The Knowledge Base currently covers AWS pretty thoroughly — that's where most of my notes have lived. But my work history spans more than just AWS. Azure, DevOps tooling, CI/CD pipelines, monitoring stacks, database work — there's a lot of documented knowledge that isn't in the Knowledge Base yet.

The plan is to keep adding. Every notebook I convert and clean is another domain the chatbot can speak to with actual authority. The more I put in, the more it can give back.

The architecture is in place. Now it's just a matter of feeding it.

*Stack: AWS Bedrock Knowledge Bases, Amazon Titan Embeddings, Lambda, S3, OneNote, Obsidian Importer, Markdown.*
