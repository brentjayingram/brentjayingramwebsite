---
title: "How to monitor a server using New Relic"
date: 2022-12-20T20:19:33-08:00
draft: false
author: Brent Ingram
tags: [new relic, monitoring]
categories: [monitoring]
---

To monitor a server using New Relic, you will need to install the New Relic agent on the server. Here are the steps to do this:  

1. Sign up for a New Relic account and create a new application.
2. Download the New Relic agent for your server's operating system.
3. Install the agent on your server. This will typically involve running an installation script or executing a package installation command.
4. Configure the agent by editing the configuration file and specifying your New Relic license key and the name you want to give to the server.
5. Start the agent. This will typically involve running a command such as systemctl start newrelic-infra.  

Once the agent is installed and running, it will begin collecting data about your server's performance and sending it to the New Relic platform. You can then use the New Relic UI to view this data and monitor your server's performance.  

To monitor specific applications or services running on the server, you may need to install additional New Relic agents or integrations. For example, to monitor a Java application, you may need to install the New Relic Java agent.