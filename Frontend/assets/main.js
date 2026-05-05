// assets/main.js

// --- Existing blogPosts manifest ---
const blogPosts = [
  {
    title: "Building My Cloud Resume Challenge: A Complete AWS Infrastructure Journey",
    date: "2026-05-04",
    slug: "cloudresumechallenge.md",
    excerpt: "The complete story of building my cloud resume using AWS services and Terraform - from static website to full serverless architecture with CI/CD."
  },
  {
    title: "Implementing DNS Failover with AWS Load Balancers and S3 Maintenance Pages",
    date: "2025-11-10",
    slug: "aws-failover-blog.md",
    excerpt: "A practical guide to implementing DNS-level failover using Route 53, ALB, and S3 static websites to ensure users never hit a broken application."
  },
  {
    title: "How to Send AWS Backup Events to ServiceNow (Using EventBridge, SNS, and CloudWatch)",
    date: "2024-04-20",
    slug: "aws-backup-servicenow-blog.md",
    excerpt: "Build operational visibility by pushing AWS backup events into ServiceNow using native AWS services for centralized alerting and incident management."
  },
  {
    title: "Designing a Scalable AWS Backup Strategy with Cross-Account Immutability",
    date: "2023-11-15",
    slug: "aws-backup-strategy-blog.md",
    excerpt: "A comprehensive approach to building resilient, cross-account backup architecture with immutable storage and Terraform automation."
  },
  {
    title: "How I used terraform to create a swa blog with Hugo",
    date: "2023-01-03",
    slug: "tfblog.md",
    excerpt: "Building a static web app blog using Terraform and Hugo after my previous hosting service deprecated my setup."
  },
  {
    title: "How to monitor a server using New Relic",
    date: "2022-12-20",
    slug: "newrelicmonitoring.md",
    excerpt: "Step-by-step guide to installing and configuring New Relic agents for server performance monitoring."
  },
  {
    title: "Why you should start using Infrastructure as Code in your organization",
    date: "2022-11-19",
    slug: "whyiac.md",
    excerpt: "Infrastructure as code treats infrastructure components as code, enabling version control, reusability, and automated management."
  },
  {
    title: "What are the differences between Azure DevOps and GitHub ?",
    date: "2022-07-20",
    slug: "devopsvsgithub.md",
    excerpt: "Comparing Azure DevOps and GitHub for code repositories, automation, and deployment processes."
  },
  {
    title: "What is CI/CD ?",
    date: "2022-06-20",
    slug: "whatiscicd.md",
    excerpt: "Continuous Integration and Continuous Delivery practices that minimize time between writing code and deploying to production."
  },
  {
    title: "What is Docker",
    date: "2021-12-20",
    slug: "whatisdocker.md",
    excerpt: "Docker makes it easier to create, deploy, and run applications using lightweight, portable containers."
  },
  {
    title: "My Experience with the 2021 NASA Space Apps Hackathon",
    date: "2021-10-24",
    slug: "nasahackathon.md",
    excerpt: "Building a React Leaflet map application to detect plastic marine debris using AI/ML - came in 2nd place!"
  },
  {
    title: "What is big O notation",
    date: "2021-04-20",
    slug: "bigo.md",
    excerpt: "A beginner's explanation of Big O Notation - measuring how well algorithms perform with different input sizes."
  },
  {
    title: "What is Merge Sort",
    date: "2021-03-26",
    slug: "mergesort.md",
    excerpt: "Understanding the divide and conquer algorithm that efficiently sorts arrays with O(n log n) complexity."
  },
  {
    title: "My Path to Becoming a Web Developer",
    date: "2020-09-01",
    slug: "mypath.md",
    excerpt: "The longer-than-expected journey from IT support to web development, dealing with imposter syndrome along the way."
  },
  {
    title: "How I created my first React Native iOS/Android App",
    date: "2019-03-10",
    slug: "reactapp.md",
    excerpt: "Creating a mobile app for a local youth group using React Native, Expo, and Firebase with a 4-month deadline."
  }
];

// --- Blog list loader (unchanged except link target) ---
function loadBlogList() {
  const container = document.getElementById("blog-list");
  if (!container) return;

  blogPosts.forEach(post => {
    const card = document.createElement("a");
    card.className = "blog-card";

    // We'll send ?post=post-1.md to a shared post.html viewer
    card.href = `blog/post.html?post=${encodeURIComponent(post.slug)}`;

    card.innerHTML = `
      <h3>${post.title}</h3>
      <div class="date">${post.date}</div>
      <p>${post.excerpt}</p>
    `;

    container.appendChild(card);
  });
}

// --- Minimal Markdown → HTML converter ---
// This is intentionally small. It's not CommonMark-perfect.
// It handles:
//  - Headings starting with #, ##, ###
//  - Bulleted lists starting with "-" or "*"
//  - Code blocks fenced with ```
//  - Bold **text** and italic *text*
//  - Paragraphs for everything else
function renderMarkdown(mdText) {
  // Strip frontmatter if present
  let content = mdText.replace(/\r\n/g, "\n");
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('\n---\n', 4);
    if (endIndex !== -1) {
      content = content.substring(endIndex + 5);
    }
  }
  
  // If content looks like HTML, extract just the article content
  if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const article = doc.querySelector('article');
    if (article) {
      // Remove the date and title elements to avoid duplication
      const dateEl = article.querySelector('.small-dim');
      const titleEl = article.querySelector('h1');
      if (dateEl) dateEl.remove();
      if (titleEl) titleEl.remove();
      return article.innerHTML;
    }
    return content;
  }
  
  const lines = content.split("\n");

  let html = "";
  let inCodeBlock = false;
  let listBuffer = [];

  function flushList() {
    if (listBuffer.length > 0) {
      html += "<ul class=\"bullets\">";
      listBuffer.forEach(item => {
        html += `<li>${inlineFormat(item)}</li>`;
      });
      html += "</ul>";
      listBuffer = [];
    }
  }

  function inlineFormat(text) {
    // bold **text**
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // italic *text*
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // inline code `code`
    text = text.replace(/`([^`]+?)`/g, "<code>$1</code>");
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code fence ``` toggles code block mode
    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        flushList();
        inCodeBlock = true;
        html += `<pre class="panel" style="background-color:#0f172a; border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:.75rem; font-size:.8rem; overflow-x:auto;"><code>`;
      } else {
        inCodeBlock = false;
        html += `</code></pre>`;
      }
      continue;
    }

    if (inCodeBlock) {
      // escape HTML inside code
      html += line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        + "\n";
      continue;
    }

    // Heading?
    if (line.startsWith("### ")) {
        flushList();
        html += `<h3>${inlineFormat(line.replace(/^###\s+/, ""))}</h3>`;
        continue;
    }
    if (line.startsWith("## ")) {
        flushList();
        html += `<h2>${inlineFormat(line.replace(/^##\s+/, ""))}</h2>`;
        continue;
    }
    if (line.startsWith("# ")) {
        flushList();
        html += `<h1>${inlineFormat(line.replace(/^#\s+/, ""))}</h1>`;
        continue;
    }

    // List item?
    if (line.match(/^\s*[-*]\s+/)) {
      const item = line.replace(/^\s*[-*]\s+/, "");
      listBuffer.push(item);
      continue;
    } else {
      // if we were building a list and hit a non-list line, close it
      flushList();
    }

    // Blank line -> spacing
    if (line.trim() === "") {
      html += "<br/>";
      continue;
    }

    // Normal paragraph text
    html += `<p class="small-dim" style="font-size:1rem;">${inlineFormat(line)}</p>`;
  }

  // Flush any trailing list
  flushList();

  // If code block never closed, close it to avoid broken DOM
  if (inCodeBlock) {
    html += `</code></pre>`;
  }

  return html;
}

// --- Single post loader ---
// On blog/post.html we read ?post=post-1.md and inject rendered HTML.
async function loadSinglePost() {
  const articleEl = document.getElementById("post-body");
  const headerTitleEl = document.getElementById("post-title");
  const headerDateEl = document.getElementById("post-date");

  if (!articleEl || !headerTitleEl || !headerDateEl) return;

  // Parse query string
  const params = new URLSearchParams(window.location.search);
  const postFile = params.get("post");

  // Find metadata from blogPosts by slug
  const meta = blogPosts.find(p => p.slug === postFile);

  if (meta) {
    headerTitleEl.textContent = meta.title;
    headerDateEl.textContent = meta.date;
  } else {
    headerTitleEl.textContent = "Post";
    headerDateEl.textContent = "";
  }

  try {
    const res = await fetch(postFile);
    const md = await res.text();
    const rendered = renderMarkdown(md);
    articleEl.innerHTML = rendered;
  } catch (err) {
    articleEl.innerHTML = "<p>Unable to load this post.</p>";
  }
}

// Run on DOM load
document.addEventListener("DOMContentLoaded", () => {
  loadBlogList();
  loadSinglePost();
  initAIChat(); // Initialize AI chat widget
});
// Track visitor on page load
fetch('https://c89m8g38k9.execute-api.us-east-1.amazonaws.com/dev/track-visitor', {
    method: 'POST'
}).catch(() => {}); // Silent fail

// Fetch and display visitor count
fetch('https://c89m8g38k9.execute-api.us-east-1.amazonaws.com/dev/track-visitor')
  .then(res => res.json())
  .then(data => {
    const el = document.getElementById('visitor-count');
    if (el) el.textContent = `• ${data.count} visitors`;
  })
  .catch(() => {});

// AI Chat Widget Implementation
function initAIChat() {
  // Create chat widget HTML
  const chatWidget = document.createElement('div');
  chatWidget.id = 'ai-chat-widget';
  chatWidget.innerHTML = `
    <div id="chat-toggle" class="chat-toggle">
      <span class="chat-icon">🤖</span>
      <span class="chat-text">Ask AI about Brent</span>
    </div>
    <div id="chat-container" class="chat-container" style="display: none;">
      <div class="chat-header">
        <span>💬 Ask about Brent's Experience</span>
        <button id="chat-close" class="chat-close">×</button>
      </div>
      <div id="chat-messages" class="chat-messages">
        <div class="ai-message">
          <strong>AI Assistant:</strong> Hi! I'm here to answer questions about Brent's experience, skills, and projects. What would you like to know?
        </div>
      </div>
      <div class="chat-input-container">
        <input id="chat-input" class="chat-input" placeholder="Ask about AWS experience, projects, skills..." maxlength="500">
        <button id="chat-send" class="chat-send">Send</button>
      </div>
      <div class="chat-loading" id="chat-loading" style="display: none;">
        <span>🤔 Thinking...</span>
      </div>
    </div>
  `;
  
  // Add CSS styles
  const chatStyles = document.createElement('style');
  chatStyles.textContent = `
    #ai-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .chat-toggle {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      border: none;
      font-size: 14px;
      font-weight: 500;
    }
    
    .chat-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }
    
    .chat-container {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 350px;
      height: 450px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      border: 1px solid #e1e5e9;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }
    
    .chat-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chat-messages {
      flex: 1;
      min-height: 0;
      padding: 15px;
      overflow-y: scroll;
      overscroll-behavior: contain;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .user-message, .ai-message {
      padding: 10px 12px;
      border-radius: 12px;
      max-width: 85%;
      word-wrap: break-word;
      line-height: 1.4;
      font-size: 14px;
    }
    
    .user-message {
      background: #667eea;
      color: white;
      align-self: flex-end;
      margin-left: auto;
    }
    
    .ai-message {
      background: #f8f9fa;
      color: #333;
      align-self: flex-start;
      border: 1px solid #e9ecef;
    }
    
    .chat-input-container {
      padding: 15px;
      border-top: 1px solid #e1e5e9;
      display: flex;
      gap: 10px;
    }
    
    .chat-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      outline: none;
      font-size: 14px;
    }
    
    .chat-input:focus {
      border-color: #667eea;
    }
    
    .chat-send {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }
    
    .chat-send:hover {
      background: #5a6fd8;
    }
    
    .chat-send:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .chat-loading {
      padding: 10px 15px;
      text-align: center;
      font-style: italic;
      color: #666;
      font-size: 14px;
    }
    
    @media (max-width: 480px) {
      .chat-container {
        width: calc(100vw - 40px);
        height: 400px;
        right: -10px;
      }
      
      .chat-toggle {
        padding: 10px 16px;
        font-size: 13px;
      }
    }
  `;
  
  // Add to page
  document.head.appendChild(chatStyles);
  document.body.appendChild(chatWidget);
  
  // Event listeners
  const toggle = document.getElementById('chat-toggle');
  const container = document.getElementById('chat-container');
  const closeBtn = document.getElementById('chat-close');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');
  const loading = document.getElementById('chat-loading');
  
  const CHAT_STORAGE_KEY = 'ai-chat-history';
  const chatHistory = [];

  // Restore saved conversation
  const savedHistory = localStorage.getItem(CHAT_STORAGE_KEY);
  if (savedHistory) {
    messages.innerHTML = '';
    JSON.parse(savedHistory).forEach(item => {
      chatHistory.push(item);
      renderMessage(item.text, item.sender);
    });
    messages.scrollTop = messages.scrollHeight;
  }

  // Restore open/closed state
  if (localStorage.getItem('ai-chat-open') === 'true') {
    container.style.display = 'flex';
  }

  // Toggle chat
  toggle.addEventListener('click', () => {
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'flex';
    localStorage.setItem('ai-chat-open', String(!isVisible));
    if (!isVisible) {
      input.focus();
    }
  });
  
  // Close chat
  closeBtn.addEventListener('click', () => {
    container.style.display = 'none';
  });
  
  // Send message
  async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;
    
    // Add user message
    addMessage(question, 'user');
    input.value = '';
    sendBtn.disabled = true;
    loading.style.display = 'block';
    
    try {
      // Call AI API
      const response = await fetch('https://c89m8g38k9.execute-api.us-east-1.amazonaws.com/dev/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addMessage(data.response, 'ai');
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', 'ai');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('Sorry, I\'m having trouble connecting right now. Please try again later.', 'ai');
    } finally {
      loading.style.display = 'none';
      sendBtn.disabled = false;
      input.focus();
    }
  }
  
  function renderMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    if (sender === 'ai') {
      const formatted = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      messageDiv.innerHTML = `<strong>AI Assistant:</strong> ${formatted}`;
    } else {
      messageDiv.textContent = text;
    }
    messages.appendChild(messageDiv);
  }

  function addMessage(text, sender) {
    chatHistory.push({ text, sender });
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistory));
    renderMessage(text, sender);
    messages.scrollTop = messages.scrollHeight;
  }
  
  // Route all wheel events over the chat window into the messages scroller
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const lineHeight = 20;
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= lineHeight;
    else if (e.deltaMode === 2) delta *= messages.clientHeight;
    messages.scrollTop += delta;
  }, { passive: false });

  // Event listeners for sending
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}
