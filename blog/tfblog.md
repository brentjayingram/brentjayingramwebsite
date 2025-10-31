---
title: "How I used terraform to create a swa blog with Hugo"
date: 2023-01-03T10:37:15-05:00
draft: false
---

### Situation

I was using a service called Stackbit to host and manage my jamstack website for a while.
I went in at some point and found out that I couldn't edit my website at all. StackBit was  a fairly new service and I was one of the first 1000 people to use it, and they actually deprecated the way that I had set it up. They had a period of time to upgrade to the newer version of managing websites, but I totally missed that window.
 So I just let it sit there.
Fast forward 6 months and I started a new job in Cloud Engineering. I specifically had been learning Terraform with Azure and have been getting my feet wet in IaC. My job provides a subscritption to Pluralsight and I went through a bunch of courses on Terraform. My favorites were taught by Ned Bellavance. I started following him on Twitter, and he mentioned making a repo for building web app blog by using Terraform.

### The Task

So I decided I was going to fork his repo and build my new blogging website from there while practicing all of my new Terraform knowledge.

### My Actions

I forked his repo on Github. I bought a spare domain to test things out.
I then cloned the forked repo to my laptop.
From there I used terraform to deploy the infrastructure to Azure. I used Azure CLI to put in the commands to do the following:  
- I created the resource group in westus2, I then created the storage account.
- I then created a store account container.
- I then setup the backend config file and placed it into the container. I placed it there to keep the state remote and safe.
- I then setup a .tfvars file with all the variables needed such as the temporary domain name.
- I deployed it with `terraform init -backend-config=backend-config.txt` . It showed me what it's plan was which included making the swa.
- I then did `terraform apply`. After it ran for a bit it spat out an api token, and some name servers.

Around this point I ran into an issue. The swa used Hugo for building the swa. And the default theme wasn't quite working for me. The CSS wasn't loading. I didn't like the theme that much anyways so I decided to go with another theme instead.  

When reading through the docs I saw that it used a yaml file for it's configuration, but the default config file is .toml for hugo. 
I tried using a .toml to .yaml converter but it was a pain.
I decided to go ahead and swap out the .toml config file for the .yaml, which I was more used to using anyways and it worked great when I ran it locally!  

After that I added the api token as a secret.
The repo already came with some GitHub Actions that allowed the workflow to publish the site from Github to Azure.

Once that was working, I went ahead and created a CNAME record and pointed it to my website on Azure and got it validated and working!

### The Result

It's a simple and neat little website that loads pretty quick thanks to Azure's CDN and this was a fun little project to stretch my wings a bit and put into practice what I've been learning. I don't have a background CMS system with this and that's okay. I wanted to learn how to write with Markdown a little bit more anyways.

I'm very thankful for [Ned Bellavance](https://nedinthecloud.com/) for creating this resource and for his Terraform tutorials on Pluralsight, it gave me the confidence to try this out and I'm very happy with the results.
